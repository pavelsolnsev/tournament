import { render } from '@testing-library/vue'
import TournamentFormLayout from '~/layouts/tournament-form.vue'

describe('tournament-form layout', () => {
  it('renders slot content inside the main section', () => {
    const slotText = 'Tournament form content'
    const { getByText } = render(TournamentFormLayout, {
      slots: {
        default: slotText,
      },
      global: {
        stubs: {
          Breadcrumbs: {
            template: '<nav data-testid="breadcrumbs" />',
          },
        },
      },
    })

    expect(getByText(slotText)).toBeInTheDocument()
  })

  it('renders breadcrumbs component (stubbed)', () => {
    const { getByTestId } = render(TournamentFormLayout, {
      global: {
        stubs: {
          Breadcrumbs: {
            template: '<nav data-testid="breadcrumbs" />',
          },
        },
      },
    })

    expect(getByTestId('breadcrumbs')).toBeInTheDocument()
  })
})

