import type { Meta, StoryObj } from '@storybook/react';

import View from './_';

const meta = {
    title: 'Components/DndKit',
    component: View,
    parameters: {
        layout: 'centered',
    },
} satisfies Meta<typeof View>;

export default meta;

type Story = StoryObj<typeof View>;

export const ViewSample1: Story = {
    args: {
        type: 'resizable',
    }
};

export const UseResizable: Story = {
    args: {
        type: 'UseResizable',
    }
};