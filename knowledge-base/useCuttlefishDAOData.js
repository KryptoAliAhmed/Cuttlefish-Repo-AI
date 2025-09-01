// hooks/useCuttlefishDAOData.js
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import daoConfig from '../config/daoConfig';
import Earth2DAOREIT_ABI from '../abi/Earth2DAOREIT.json';
import GoldenNFT_ABI from '../abi/GoldenNFT.json';

export default function useCuttlefishDAOData() {
  const [daoState, setDaoState] = useState('idle');
  const [metrics, setMetrics] = useState({
    treasury: 0,
    mwCompute: 0,
    carbonOffset: 0,
    nftCount: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const provider = new ethers.providers.JsonRpcProvider(daoConfig.rpcUrl);
        const daoContract = new ethers.Contract(
          daoConfig.daoAddress,
          Earth2DAOREIT_ABI,
          provider
        );
        const nftContract = new ethers.Contract(
          daoConfig.nftAddress,
          GoldenNFT_ABI,
          provider
        );

        const treasuryBal = await daoContract.balanceOf(daoConfig.daoAddress);
        const treasuryE2R = Number(ethers.utils.formatUnits(treasuryBal, 18));

        let totalMw = 0;
        let totalCarbon = 0;
        let nftCount = 0;

        for (let id = 1; id <= daoConfig.maxNftId; id++) {
          try {
            const owner = await daoContract.stakedNftOwners(id);
            if (owner !== ethers.constants.AddressZero) {
              nftCount++;
              const assets = await daoContract.getUserTotalStakedAssets(owner);
              totalMw += Number(ethers.utils.formatUnits(assets.totalMwCompute, 0));
              totalCarbon += Number(ethers.utils.formatUnits(assets.totalCarbonOffset, 0));
            }
          } catch (err) {}
        }

        let state = 'idle';
        if (treasuryE2R > daoConfig.thresholds.excited) state = 'excited';
        else if (nftCount > 0 && nftCount <= daoConfig.thresholds.curious) state = 'curious';
        else if (nftCount > daoConfig.thresholds.curious) state = 'thinking';

        setMetrics({
          treasury: treasuryE2R.toFixed(2),
          mwCompute: totalMw,
          carbonOffset: totalCarbon,
          nftCount
        });
        setDaoState(state);
      } catch (error) {
        console.error('Error fetching DAO data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return { daoState, metrics };
}
