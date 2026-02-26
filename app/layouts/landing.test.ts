import { render } from '@testing-library/vue'
import LandingLayout from '~/layouts/landing.vue'

describe('landing layout', () => {
  it('renders slot content', () => {
    const slotText = 'Landing content'
    const { getByText } = render(LandingLayout, {
      slots: {
        default: slotText,
      },
    })

    expect(getByText(slotText)).toBeInTheDocument()
  })

  it('applies base layout classes', () => {
    const { container } = render(LandingLayout)

    expect(container.firstElementChild).toHaveClass(
      'min-h-screen',
      'bg-slate-900',
      'text-slate-100',
    )
  })
})

