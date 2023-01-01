import React from 'react';
import logos from '../../config/logos.json';

export default function TokenIcon({ symbol }) {
  let imgSrc = logos[symbol];

  if (imgSrc) {
    if (imgSrc.indexOf('/icons/tokens/') > 0) {
      imgSrc = require(imgSrc);
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
        height: 40,
        width: 40,
      }}
    >
      {imgSrc ? <img alt="Logo" src={imgSrc} /> : <div></div>}
    </div>
  );
}
