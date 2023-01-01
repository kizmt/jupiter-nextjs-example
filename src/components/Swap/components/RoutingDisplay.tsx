import React from "react";
import {
  makeStyles,
  Typography,
} from "@material-ui/core";

import { ReactComponent as RightArrow } from '../../../assets/img/RightArrow.svg'

import Markets from "../../../config/markets.json"
import Logos from "../../../config/logos.json"

const useStyles = makeStyles(() => ({
  routingRoot: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  assets: {
    display: 'flex',
    flexWrap: 'wrap'
  },
  assetRoot: {
    display: 'flex',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#090B0B',
    padding: '4px 8px',
    marginRight: 8
  },
  assetLogo: {
    width: 16,
    height: 16,
    marginRight: 6
  }
}));

const RoutingDisplay = (props) => {

  const { route, fromSymbol } = props
  const classes = useStyles()

  const assetsMap = {}
  let index = 1

  if(route && route.markets) {
    route.markets.forEach(m => {
      const market = Markets.find(x => x.address === m.toString())
      const assets = market?.name.split('/') || []

      if(route.markets.length === 1) {
        if(assets[1] === fromSymbol) {
          assets.reverse()
        }
      }
      
      assets.forEach(a => {
        if(!assetsMap[a]) {
          const logo = Logos[a]
          assetsMap[a] = {
            symbol: a,
            logo,
            index
          }
          index++
        }
      })
    })
  }

  return (
    <div className={classes.routingRoot} style={{ marginTop: 8 }}>
      <Typography style={{ marginRight: 16, color: '#676767' }}>Routing</Typography>
      <div className={classes.assets}>
        {Object.values(assetsMap).map((a: any, index: number) => {

          let imgSrc = a.logo

          if(imgSrc) {
            if(imgSrc.indexOf("/icons/tokens/") > 0) {
              imgSrc = require(imgSrc)
            }
          }

          return (
            <div key={a.symbol} style={{ display: 'flex', alignItems: 'center' }}>
              <RouteAsset symbol={a.symbol} logo={imgSrc} />

              {index < Object.keys(assetsMap).length - 1 && 
                <RightArrow style={{ marginRight: 8, marginTop: 8 }}/>
              } 
            </div>
            )
        })}
      </div>
    </div> 
  )

}

const RouteAsset = (props) => {

  const { symbol, logo } = props;
  const classes = useStyles()

  return (
    <div className={classes.assetRoot} style={{ marginTop: 8 }}>
      <img alt="Logo" src={logo} className={classes.assetLogo}/>
      <Typography style={{ fontWeight: 600 }}>{symbol}</Typography>
    </div>
  )

}

export default RoutingDisplay