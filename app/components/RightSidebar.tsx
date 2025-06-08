import React from 'react';
import { tags } from '../../lib/tags';

interface RightSidebarProps {
  activeTag: string | null;
  setActiveTag: (tag: string | null) => void;
  setActiveFilter: (filter: string) => void;
}

const RightSidebar: React.FC<RightSidebarProps> = ({ activeTag, setActiveTag, setActiveFilter }) => {
  return (
    <div style={{ width: '300px', borderLeft: '1px solid #ccc', padding: '1rem' }}>
      {Object.entries(tags).map(([category, tagList]) => (
        <div key={category}>
          <h3>{category}</h3>
          <ul>
            {tagList.map((tag) => (
              <li
                key={tag}
                onClick={() => {
                  if (activeTag === tag) {
                    setActiveTag(null);
                  } else {
                    setActiveTag(tag);
                  }
                }}
                style={{
                  cursor: 'pointer',
                  padding: '0.5rem',
                  backgroundColor: activeTag === tag ? '#e0e0e0' : 'transparent',
                }}
              >
                {tag}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default RightSidebar;