import React from 'react';
import Image from 'next/image';
import QuestionMarkImage from '../assets/question-mark.png';
import LogoImage from '../assets/logo.png';

/**
 * Reusable Logo component for the Guess Who game
 * @param {Object} props - Component props
 * @param {string} props.size - Size variant: 'large' or 'small'
 */
const Logo = ({ size = 'large' }) => {
  if (size === 'small') {
    return (
            <div className="h-full flex items-center justify-center pt-6 px-1">
              <Image
                src={LogoImage}
                width={90}
                height={90}
                alt="Guess who logo"
              />
      </div>
    );
  }

  return (
    <div className="relative inline-block p-4">
      <Image src={LogoImage} alt="Guess who logo" width={250} height={250} />
    </div>
  );
};

export default Logo;
