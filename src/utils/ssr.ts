import { NextPageContext } from 'next';
import { initializeApollo } from 'config/client';
import { parseCookies } from 'src/utils/cookies';
import { DocumentNode } from 'graphql';
import { appConstants } from 'server/utils/appConstants';

const cookieProps = (
  context: NextPageContext,
  noAuth?: boolean
): { theme: string; authenticated: boolean } => {
  if (!context?.req) return { theme: 'dark', authenticated: false };

  const cookies = parseCookies(context.req);

  if (!cookies[appConstants.cookieName] && !noAuth) {
    context.res?.writeHead(302, { Location: '/' });
    context.res?.end();

    return { theme: 'dark', authenticated: false };
  }

  if (cookies?.theme) {
    return { theme: cookies.theme, authenticated: true };
  }
  return { theme: 'dark', authenticated: true };
};

type QueryProps = {
  document: DocumentNode;
  variables: {};
};

const isNotDocumentNode = (
  toBeDetermined: DocumentNode | QueryProps
): toBeDetermined is QueryProps => {
  if ((toBeDetermined as QueryProps).document) {
    return true;
  }
  return false;
};

export const getProps = async (
  context: NextPageContext,
  queries?: (DocumentNode | QueryProps)[],
  noAuth?: boolean
) => {
  const { theme, authenticated } = cookieProps(context, noAuth);

  const apolloClient = initializeApollo(undefined, context);

  if (queries?.length && authenticated) {
    for (const query of queries) {
      if (isNotDocumentNode(query)) {
        await apolloClient.query({
          query: query.document,
          variables: query.variables,
        });
      } else {
        await apolloClient.query({
          query,
        });
      }
    }
  } else {
    return { props: { initialConfig: { theme } } };
  }

  return {
    props: {
      initialApolloState: apolloClient.cache.extract(),
      initialConfig: { theme },
    },
  };
};
