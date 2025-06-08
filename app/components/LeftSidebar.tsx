import React from 'react';

interface LeftSidebarProps {
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  setActiveTag: (tag: null) => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ activeFilter, setActiveFilter, setActiveTag }) => {
  const filters = ['All unread mails', 'Important mails', 'Urgent Mails', 'Can Be Ignored Mails'];

  return (
    <div style={{ width: '250px', borderRight: '1px solid #ccc', padding: '1rem' }}>
      <ul>
        {filters.map((filter) => (
          <li
            key={filter}
            onClick={() => {
              setActiveFilter(filter);
            }}
            style={{
              cursor: 'pointer',
              padding: '0.5rem',
              backgroundColor: activeFilter === filter ? '#e0e0e0' : 'transparent',
            }}
          >
            {filter}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LeftSidebar;