import type { Meta, StoryObj } from '@storybook/react';

import View from './_';

const meta = {
    title: 'Components/WebGL',
    component: View,
    parameters: {
        layout: 'centered',
    },
} satisfies Meta<typeof View>;

export default meta;

type Story = StoryObj<typeof View>;

export const ViewInit: Story = {
    args: {
        type: 'init'
    }
};

export const ViewCube: Story = {
    args: {
        type: 'cube'
    }
};

export const ViewCamera: Story = {
    args: {
        type: 'camera'
    }
};

export const ViewTwglInit: Story = {
    args: {
        type: 'twgl-init'
    }
};