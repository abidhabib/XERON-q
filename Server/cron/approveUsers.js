import { ethers, formatUnits } from "ethers";
import axios from "axios";
import { queryAsync } from "../utils/queryAsync.js"; 

const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.defibit.io");
const MIN_REQUIRED = 10;
const APPROVE_ENDPOINT = `http://localhost:${process.env.PORT}/approveUser`;
const REJECT_ENDPOINT = `http://localhost:${process.env.PORT}/rejectUserCurrMin`;

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
        console.log(`Transaction invalid/failed for user ${user.id}. Rejecting.`);
        await axios.put(`${REJECT_ENDPOINT}/${user.id}`);
        continue;
    }

    const methodId = tx.data.slice(0, 10);
    if (methodId !== '0xa9059cbb') {
        console.log(`Transaction for user ${user.id} has wrong method. Rejecting.`);
        await axios.put(`${REJECT_ENDPOINT}/${user.id}`);
        continue;
    }

    const toAddress = "0x" + tx.data.slice(34, 74).toLowerCase();
    const valueHex = "0x" + tx.data.slice(74);
    const amount = parseFloat(formatUnits(valueHex, 18));

    if (!allowedAddresses.includes(toAddress)) {
        await axios.put(`${REJECT_ENDPOINT}/${user.id}`);
        continue;
    }
    if (amount < MIN_REQUIRED) {
        await axios.put(`${REJECT_ENDPOINT}/${user.id}`);
        continue;
    }

    // If all checks pass, proceed to approve
    await axios.put(`${APPROVE_ENDPOINT}/${user.id}`);
} catch (err) {
     await axios.put(`${REJECT_ENDPOINT}/${user.id}`);


}
        }
    } catch (err) {
        console.error("Failed:", err.message);
    }
}
