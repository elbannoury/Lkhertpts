import React from 'react';
import { Helmet } from 'react-helmet-async';

/** Keeps private / utility pages (admin, affiliate portal, order tracking, 404) out of search results.
 *  We use a meta tag rather than robots.txt on purpose: listing the secret admin URLs in robots.txt would advertise them. */
const NoIndex: React.FC = () => (
  <Helmet>
    <meta name="robots" content="noindex, nofollow" />
  </Helmet>
);

export default NoIndex;
