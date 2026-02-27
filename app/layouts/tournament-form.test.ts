import { render } from '@testing-library/vue'
import TournamentFormLayout from '~/layouts/tournament-form.vue'

describe('tournament-form layout', () => {
  it('renders slot content inside the main section', () => {
    const slotText = 'Tournament form content'
    const { getByText } = render(TournamentFormLayout, {
      slots: {
        default: slotText,
      },
    })

    expect(getByText(slotText)).toBeInTheDocument()
  })
})

