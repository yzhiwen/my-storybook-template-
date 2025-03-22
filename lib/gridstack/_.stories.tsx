import type { Meta, StoryObj } from '@storybook/react';

import View from './_';

const meta = {
    title: 'Components/GridStack',
    component: View,
    parameters: {
        layout: 'centered',
    },
} satisfies Meta<typeof View>;

export default meta;

type Story = StoryObj<typeof View>;

export const GridSample: Story = {
    args: {
    }
};

export const MixGridSample: Story = {
    args: {
        type: 'mix'
    }
};