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

export const ViewTwglObjModel: Story = {
    args: {
        type: 'twgl-objmodel'
    }
};

export const ViewTwglPlane: Story = {
    args: {
        type: 'twgl-plane'
    }
};

export const ViewTwglPoint: Story = {
    args: {
        type: 'twgl-point'
    }
};

export const ViewTwglLine: Story = {
    args: {
        type: 'twgl-line'
    }
};

export const ViewTwgCyliner: Story = {
    args: {
        type: 'twgl-cyliner'
    }
};

export const ViewTwoCamera: Story = {
    args: {
        type: 'twgl-tow-camera'
    }
};