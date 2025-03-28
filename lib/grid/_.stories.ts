import type { Meta, StoryObj } from '@storybook/react';

import View from './_';

const meta = {
    title: 'Components/GridSample',
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

export const GridArem: Story = {
    args: {
        type: 'arem'
    }
};
export const SubGrid: Story = {
    args: {
        type: 'subgrid'
    }
};
export const GridItemFlip: Story = {
    args: {
        type: 'grid-item-flip'
    }
};

export const GridItemDnd: Story = {
    args: {
        type: 'grid-item-dnd'
    }
};

export const GridItemDndResize: Story = {
    args: {
        type: 'grid-item-dnd-resize'
    }
};