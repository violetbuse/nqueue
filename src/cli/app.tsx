import React from "react";
import { render, Text } from "ink";

const App = () => {
  return <Text>my app</Text>;
};

export const render_app = () => {
  render(<App />);
};
