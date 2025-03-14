import type { Meta, StoryObj } from '@storybook/react';

import View from './GridSample1';

const meta = {
  title: 'Components/GridSample1',
  component: View,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof View>;

export default meta;

type Story = StoryObj<typeof View>;

export const DefaultView: Story = {
    args: {
    }
};

export const DefaultView2: Story = {
    args: {
        type: 'arem'
    }
};