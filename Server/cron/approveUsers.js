import { ethers, formatUnits } from "ethers";
import axios from "axios";
import { queryAsync } from "../utils/queryAsync.js"; 

const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.defibit.io");
const MIN_REQUIRED = 10;
const APPROVE_ENDPOINT = `http://localhost:${process.env.PORT}/approveUser`;
const REJECT_ENDPOINT = `http://localhost:${process.env.PORT}/rejectUser`;

async function getActiveBep20Addresses() {
    const rows = await queryAsync(`SELECT bep20_address FROM bep20_settings WHERE is_active = 1`);
    return rows.map(r => r.bep20_address.toLowerCase());
}

export async function checkAndApproveUsers() { 

  try {
  const users = await queryAsync(`
    SELECT id, trx_id 
    FROM users 
    WHERE approved = 0 
      AND payment_ok = 1 
      AND rejected = 0 
      AND trx_id IS NOT NULL
  `);


        const allowedAddresses = await getActiveBep20Addresses();

        for (const user of users) {
            console.log(`Checking txtID for user ${user.id}: ${user.trx_id}`);

          try {
    const tx = await provider.getTransaction(user.trx_id);
    const receipt = await provider.getTransactionReceipt(user.trx_id);

    if (!tx || !receipt || receipt.status !== 1) {
        // --- NEW: Reject on Transaction Not Found or Failed ---
        console.log(`Transaction invalid/failed for user ${user.id}. Rejecting.`);
        await axios.put(`${REJECT_ENDPOINT}/${user.id}`); // Define REJECT_ENDPOINT
        console.log(`User ${user.id} rejected due to invalid/failed transaction.`);
        // --- END NEW ---
        continue;
    }

    const methodId = tx.data.slice(0, 10);
    if (methodId !== '0xa9059cbb') {
         // --- NEW: Reject on Wrong Method ---
        console.log(`Transaction for user ${user.id} has wrong method. Rejecting.`);
        await axios.put(`${REJECT_ENDPOINT}/${user.id}`);
        console.log(`User ${user.id} rejected due to wrong transaction method.`);
        // --- END NEW ---
        continue;
    }

    const toAddress = "0x" + tx.data.slice(34, 74).toLowerCase();
    const valueHex = "0x" + tx.data.slice(74);
    const amount = parseFloat(formatUnits(valueHex, 18));

    if (!allowedAddresses.includes(toAddress)) {
         // --- NEW: Reject on Wrong Recipient ---
        console.log(`Transaction for user ${user.id} sent to wrong address. Rejecting.`);
        await axios.put(`${REJECT_ENDPOINT}/${user.id}`);
        console.log(`User ${user.id} rejected due to wrong recipient address.`);
        // --- END NEW ---
        continue;
    }
    if (amount < MIN_REQUIRED) {
         // --- NEW: Reject on Insufficient Amount ---
        console.log(`Transaction for user ${user.id} has insufficient amount. Rejecting.`);
        await axios.put(`${REJECT_ENDPOINT}/${user.id}`);
        console.log(`User ${user.id} rejected due to insufficient transaction amount.`);
        // --- END NEW ---
        continue;
    }

    // If all checks pass, proceed to approve
    await axios.put(`${APPROVE_ENDPOINT}/${user.id}`);
    console.log(`User ${user.id} auto-matched.`);
} catch (err) {
    console.error(`Error with TX for user ${user.id}:`, err.message);
     await axios.put(`${REJECT_ENDPOINT}/${user.id}`);
     console.log(`User ${user.id} rejected due to error with transaction.`);
     

}
        }
    } catch (err) {
        console.error("Failed:", err.message);
    }
}
