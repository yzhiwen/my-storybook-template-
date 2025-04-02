import type { Meta, StoryObj } from '@storybook/react';

import View from './_';

const meta = {
    title: 'Components/rc',
    component: View,
    parameters: {
        layout: 'centered',
    },
} satisfies Meta<typeof View>;

export default meta;

type Story = StoryObj<typeof View>;

export const Select: Story = {
    args: {
        type: 'select'
    }
};