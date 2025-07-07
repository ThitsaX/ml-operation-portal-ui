import { Splide, type SplideProps, SplideSlide } from '@splidejs/react-splide'
import '@splidejs/react-splide/css'
import { memo, type ReactElement } from 'react'

export interface CarouselProps extends SplideProps {
  data?: ReactElement[]
}

const Carousel = ({ data, options, ...props }: CarouselProps) => {
  return (
    <Splide
      options={{
        rewind: true,
        drag: 'free',
        snap: true,
        perPage: 2,
        gap: '0.5rem',
        pagination: false,
        ...options
      }}
      {...props}
    >
      {data?.map((component, index) => {
        return (
          <SplideSlide key={`${component.key}-splide-${index}`}>
            {component}
          </SplideSlide>
        )
      })}
    </Splide>
  )
}

export default memo(Carousel)
