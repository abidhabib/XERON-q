import { ethers, formatUnits } from "ethers";
import axios from "axios";
import { queryAsync } from "../utils/queryAsync.js"; 

const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.defibit.io");
const MIN_REQUIRED = 10;
const APPROVE_ENDPOINT = `http://localhost:${process.env.PORT}/approveUser`;
const REJECT_ENDPOINT = `http://localhost:${process.env.PORT}/rejectUserCurrMin`;



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


      
    } catch (err) {
        console.error("Failed:", err.message);
    }
}
