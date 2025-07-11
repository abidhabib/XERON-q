// SubadminStatsCard.jsx (separate component)
import PropTypes from 'prop-types';
import { RemoveTrailingZeros } from '../../../utils/utils';

const SubadminStatsCard = ({ admin }) => {
  const {
    subadmin = '',
    totalApprovedCount = 0,
    totalApprovedAmount = 0,
    todayApprovedCount = 0,
    todayApprovedAmount = 0
  } = admin;

  return (
    <article className="bg-white p-4 rounded-lg shadow-xs hover:shadow-md transition-shadow border border-gray-100">
      <header className="mb-2">
        <h3 className="text-sm font-semibold text-indigo-600 truncate" title={subadmin}>
          {subadmin}
        </h3>
        <p className="text-xs text-gray-500">Withdrawals Approved</p>
      </header>

      <dl className="text-sm space-y-1.5">
        <StatItem 
          label="Total Count" 
          value={totalApprovedCount}
          valueClass="text-gray-800"
        />
        <StatItem 
          label="Total Amount" 
          value={`$${RemoveTrailingZeros(totalApprovedAmount)}`}
          valueClass="text-green-600"
        />
        <StatItem 
          label="Today Count" 
          value={todayApprovedCount}
          valueClass="text-gray-800"
        />
        <StatItem 
          label="Today Amount" 
          value={`$${RemoveTrailingZeros(todayApprovedAmount)}`}
          valueClass="text-blue-600"
        />
      </dl>
    </article>
  );
};

const StatItem = ({ label, value, valueClass }) => (
  <div className="flex justify-between">
    <dt className="text-gray-600">{label}:</dt>
    <dd className={`font-medium ${valueClass}`}>
      {value}
    </dd>
  </div>
);

// Prop type validations
SubadminStatsCard.propTypes = {
  admin: PropTypes.shape({
    subadmin: PropTypes.string,
    subadminId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    totalApprovedCount: PropTypes.number,
    totalApprovedAmount: PropTypes.number,
    todayApprovedCount: PropTypes.number,
    todayApprovedAmount: PropTypes.number
  }).isRequired
};

export default SubadminStatsCard;