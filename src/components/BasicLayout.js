import { Layout } from 'antd';
import React, { useEffect } from 'react';
import TopBar from './TopBar';
import { CustomFooter as Footer } from './Footer';
import { useReferrer } from '../utils/referrer';
import queryString from 'query-string';
import { useLocation } from 'react-router-dom';
import { notify } from '../utils/notifications';
import DisclaimerModal from './DisclaimerModal';
import { useLocalStorageState } from '../utils/utils';
const { Header, Content } = Layout;

export default function BasicLayout({ children }) {
  const { refCode, setRefCode, allowRefLink } = useReferrer();
  const { search } = useLocation();
  const parsed = queryString.parse(search);

  const [disclaimerAccepted] = useLocalStorageState(
    'is_disclaimer_ok_13052022',
    false,
  );

  // console.log('disclaimerAccepted: ', disclaimerAccepted);

  useEffect(() => {
    if (!!parsed.refCode && parsed.refCode !== refCode && allowRefLink) {
      notify({ message: `New referrer ${parsed.refCode} added` });
      setRefCode(parsed.refCode);
    }
  }, [parsed, refCode, setRefCode, allowRefLink]);

  return (
    <React.Fragment>
      <Layout
        style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}
      >
        <Header style={{ padding: 0, minHeight: 64, height: 'unset' }}>
          <TopBar />
        </Header>
        <Content style={{ flex: 1 }}>{children}</Content>
        <Footer />
        {!disclaimerAccepted && (
          <DisclaimerModal isOpen={!disclaimerAccepted} onClose={() => {}} />
        )}
      </Layout>
    </React.Fragment>
  );
}
