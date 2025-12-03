import React from 'react';
import { Rnd } from 'react-rnd';

const ResizableBox = ({ children, ...props }) => {
  const style = {
    border: '1px solid #ddd',
    background: 'var(--color-background)',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    borderRadius: '8px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    ...props.style,
  };

  return (
    <Rnd
      minWidth={200}
      minHeight={100}
      bounds="parent"
      {...props}
      style={style}
    >
      <div style={{ flexGrow: 1, padding: '20px', overflow: 'auto' }}>
        {children}
      </div>
    </Rnd>
  );
};

export default ResizableBox;

