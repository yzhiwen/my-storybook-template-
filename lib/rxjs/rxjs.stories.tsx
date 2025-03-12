import type { Meta, StoryObj } from '@storybook/react';

import RxView from './RxView';

const meta = {
  title: 'Components/RxView',
  component: RxView,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof RxView>;

export default meta;

type Story = StoryObj<typeof RxView>;

export const DefaultView: Story = {
};