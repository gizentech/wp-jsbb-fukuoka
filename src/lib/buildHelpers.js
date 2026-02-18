export const withRevalidate = (props, seconds = 60) => {
    if (process.env.NEXT_PUBLIC_EXPORT_MODE === 'true') {
      return { props };
    }
    return {
      props,
      revalidate: seconds
    };
  };