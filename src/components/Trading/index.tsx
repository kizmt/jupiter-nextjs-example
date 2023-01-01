import * as React from 'react';
import './index.css';
import {
  ChartingLibraryWidgetOptions,
  IChartingLibraryWidget,
  ResolutionString,
} from '../../charting_library/charting_library'; // Make sure to follow step 1 of the README
import { widget } from '../../charting_library/charting_library.esm';
import { useMarket } from '../../utils/markets';
import { BONFIDA_DATA_FEED } from '../../utils/bonfidaConnector';

// This is a basic example of how to create a TV widget
// You can add more feature such as storing charts in localStorage

export interface ChartContainerProps {
  symbol: ChartingLibraryWidgetOptions['symbol'];
  interval: ChartingLibraryWidgetOptions['interval'];
  datafeedUrl: string;
  libraryPath: ChartingLibraryWidgetOptions['library_path'];
  chartsStorageUrl: ChartingLibraryWidgetOptions['charts_storage_url'];
  chartsStorageApiVersion: ChartingLibraryWidgetOptions['charts_storage_api_version'];
  clientId: ChartingLibraryWidgetOptions['client_id'];
  userId: ChartingLibraryWidgetOptions['user_id'];
  fullscreen: ChartingLibraryWidgetOptions['fullscreen'];
  autosize: ChartingLibraryWidgetOptions['autosize'];
  width: ChartingLibraryWidgetOptions['width'];
  studiesOverrides: ChartingLibraryWidgetOptions['studies_overrides'];
  containerId: ChartingLibraryWidgetOptions['container_id'];
  theme: string;
}

export interface ChartContainerState { }

export const TVChartContainer = () => {
  // @ts-ignore
  const defaultProps: ChartContainerProps = {
    symbol: 'BTC/USDT',
    interval: '15' as ResolutionString,
    theme: 'Dark',
    containerId: 'tv_chart_container',
    datafeedUrl: BONFIDA_DATA_FEED,
    libraryPath: '/charting_library/',
    fullscreen: false,
    autosize: true,
    width: 600,
    studiesOverrides: {
      'volume.volume.color.0': '#DE0269',
      'volume.volume.color.1': '#0AD171',
      'volume.precision': 6,
    },
  };

  const tvWidgetRef = React.useRef<IChartingLibraryWidget | null>(null);
  const { market, marketName, customMarkets } = useMarket();

  let isCustomMarket = market &&
    customMarkets.find(cMarket => cMarket.address === market.address.toBase58());

  let parsedMarketName;
  switch (marketName) {
    case 'BTC/WUSDT':
      parsedMarketName = 'BTC/USDT';
      break;
    case 'ETH/WUSDT':
      parsedMarketName = 'ETH/USDT';
      break;
    default:
      parsedMarketName = marketName;
  }

  React.useEffect(() => {
    if (!parsedMarketName) {
      return;
    }
    if (isCustomMarket) {
      return;
    }
    const widgetOptions: ChartingLibraryWidgetOptions = {
      symbol: parsedMarketName,
      // BEWARE: no trailing slash is expected in feed URL
      // tslint:disable-next-line:no-any
      datafeed: new (window as any).Datafeeds.UDFCompatibleDatafeed(defaultProps.datafeedUrl),
      interval: defaultProps.interval as ChartingLibraryWidgetOptions['interval'],
      container_id: defaultProps.containerId as ChartingLibraryWidgetOptions['container_id'],
      library_path: defaultProps.libraryPath as string,
      locale: 'en',
      disabled_features: [
        'use_localstorage_for_settings',
        'timeframes_toolbar',
        // 'volume_force_overlay',
        // 'left_toolbar',
        'show_logo_on_all_charts',
        'caption_buttons_text_if_possible',
        'header_settings',
        'header_chart_type',
        'header_compare',
        'compare_symbol',
        'header_screenshot',
        // 'header_widget_dom_node',
        'header_saveload',
        'header_undo_redo',
        'header_interval_dialog_button',
        'show_interval_dialog_on_key_press',
        'header_symbol_search',
        // 'header_resolutions',
        // 'header_widget',
      ],
      enabled_features: ['hide_left_toolbar_by_default', 'study_templates'],
      load_last_chart: true,
      client_id: defaultProps.clientId,
      user_id: defaultProps.userId,
      fullscreen: defaultProps.fullscreen,
      width: defaultProps.width,
      autosize: defaultProps.autosize,
      studies_overrides: defaultProps.studiesOverrides,
      theme: 'Dark',
      toolbar_bg: '#121616',
      overrides: {
        'paneProperties.background': '#121616',
        'scalesProperties.backgroundColor': '#121616',
        'paneProperties.legendProperties.backgroundTransparency': true,
        'mainSeriesProperties.candleStyle.upColor': '#0AD171',
        'mainSeriesProperties.candleStyle.downColor': '#DE0269',
        'mainSeriesProperties.candleStyle.drawWick': true,
        'paneProperties.vertGridProperties.color': 'rgba(0,0,0,0)',
        'paneProperties.horzGridProperties.color': 'rgba(0,0,0,0)',
        'mainSeriesProperties.candleStyle.drawBorder': true,
        'mainSeriesProperties.candleStyle.borderColor': '#0AD171',
        'mainSeriesProperties.candleStyle.borderUpColor': '#0AD171',
        'mainSeriesProperties.candleStyle.borderDownColor': '#DE0269',
        'mainSeriesProperties.candleStyle.wickUpColor': '#0AD171',
        'mainSeriesProperties.candleStyle.wickDownColor': '#DE0269',
        'paneProperties.legendProperties.showStudyTitles': false,
        'scalesProperties.showStudyLastValue': false,
        'paneProperties.legendProperties.showBackground': false,
      },
    };

    const tvWidget = new widget(widgetOptions);
    tvWidgetRef.current = tvWidget;

    tvWidget.onChartReady(() => {
      tvWidget.headerReady().then(() => {
        const button = tvWidget.createButton();
        button.setAttribute('title', 'Click to show a notification popup');
        button.classList.add('apply-common-tooltip');
        button.addEventListener('click', () =>
          tvWidget.showNoticeDialog({
            title: 'Notification',
            body: 'Please Ape Safe, do your own research before trading any token listed on SOLAPE SWAP :)',
            callback: () => {
              // console.log('It works!!');
            },
          }),
        );
        button.innerHTML = 'HOME OF THE APE';
      });
    });
    //eslint-disable-next-line
  }, [market]);

  return <>
    {isCustomMarket
      ? <></>
      : <div id={defaultProps.containerId} className="tradingview-chart" />
    }
  </>;
};
