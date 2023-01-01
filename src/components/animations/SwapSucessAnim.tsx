import React from 'react';
import { useLottie } from 'lottie-react';
import groovyWalkAnimation from '../../assets/anim/thumbsup.json';

const SwapSuccessAnim = () => {
  const options = {
    animationData: groovyWalkAnimation,
    loop: false,
    autoplay: false,
  };

  const { View } = useLottie(options);

  return <>{View}</>;
};

export default SwapSuccessAnim;
