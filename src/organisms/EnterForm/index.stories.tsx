import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { EnterForm } from '.';

const meta = {
  component: EnterForm,
  args: {
    submitLabel: 'Save to the board',
    isSubmitting: false,
    error: null,
    onSubmit: fn(),
    onSkip: fn(),
  },
} satisfies Meta<typeof EnterForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Submits: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText(/Name/), 'riddim rat');
    await userEvent.type(canvas.getByLabelText(/Password/), 'correct horse');
    await userEvent.click(
      canvas.getByRole('button', { name: 'Save to the board' }),
    );
    await expect(args.onSubmit).toHaveBeenCalledWith({
      name: 'RIDDIM_RAT',
      password: 'correct horse',
    });
  },
};

export const SaysWhatIsWrong: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText(/Name/), 'b!');
    await userEvent.click(
      canvas.getByRole('button', { name: 'Save to the board' }),
    );
    await expect(canvas.getByText('At least 3 characters')).toBeVisible();
    await expect(canvas.getByText('At least 8 characters')).toBeVisible();
    await expect(args.onSubmit).not.toHaveBeenCalled();
  },
};

export const OffensiveName: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText(/Name/), 'sh1t head');
    await userEvent.type(canvas.getByLabelText(/Password/), 'correct horse');
    await userEvent.click(
      canvas.getByRole('button', { name: 'Save to the board' }),
    );
    await expect(canvas.getByText('Pick another name')).toBeVisible();
    await expect(args.onSubmit).not.toHaveBeenCalled();
  },
};

export const WrongPassword: Story = {
  args: { error: "That's not the password for RIDDIMRAT" },
};

export const Saving: Story = { args: { isSubmitting: true } };
