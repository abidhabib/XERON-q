import React, { useState, useEffect, useContext, useMemo } from 'react';

import './DailyTask.css';

import { UserContext } from './UserContext/UserContext';
import NavBAr from './NavBAr';
import toast, { Toaster } from 'react-hot-toast';
import   {WithdrwaHistory}  from './MyWithdrwal'
import Modal from 'react-modal';
Modal.setAppElement('#root');
import { useNavigate } from 'react-router-dom';
import { RemoveTrailingZeros } from '../utils/utils';

const Wallet = () => {

  const { userData, fetchUserData } = useContext(UserContext);

 




  useEffect(() => {
      fetchUserData();
  }, []);


const navigate=useNavigate()


const toWithdrwa=()=>{  navigate('/cashout')
}
  return (
    <>
    <div className="logo-m">
      <NavBAr />
    </div>

    <div className="wallet-card  py-5 card-1">
      <div className="right-part">
        <p className='p-0 m-0'>CURRENT USD</p>
        <p className='text-center balance m-0 mb-2 mt-1 fw-bold'>{RemoveTrailingZeros(Number(userData?.balance))} $</p>

        <button className='withdrwa-button rounded-4 px-4 p-1' onClick={toWithdrwa}>
          <span>GET MONEY</span>
        </button>
      </div>

      <div className="right-part">
        <p className='p-0 m-0'>TOTAL GET</p>
        <p className='text-center balance m-0 mb-2 mt-1 fw-bold'>{RemoveTrailingZeros(Number(userData?.total_withdrawal))} $</p>

        <button className='withdrwa-button rounded-4 px-4 p-1' onClick={() => { navigate('/withdrwas') }}>
          <span>See Details</span>
        </button>

      </div>
    </div>

    <div className="scrollable-container">
      <WithdrwaHistory />
    </div>
    <Toaster />

  </>
  );
};

export default Wallet;