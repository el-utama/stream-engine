import React from 'react';

interface Props {
  name: string;
}

const TestComponent: React.FC<Props> = ({ name }) => {
  return (
    <div>
      <h1>Hello {name}</h1>
      <p>This is a test component</p>
    </div>
  );
};

export default TestComponent;
