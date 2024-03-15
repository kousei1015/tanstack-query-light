# tanstack-query-light

tanstack-queryのuseQueryのコードを150程度で再現したコードです。以下の動画とサイトを基に作りました。ただし参考サイトとは異なり、DevToolなど一部のコードは省略しています。

参考にしたサイト: <https://portal.gitnation.org/contents/lets-build-react-query-in-150-lines-of-code>

上の参考サイトの動画版: <https://www.youtube.com/watch?v=9SrIirrnwk0&t=1068s>

以下がtanstack-queryのuseQueryをミニマムに再現したコードです。
```
import * as React from "react";

const context = React.createContext();

export function QueryClientProvider({ children, client }) {
  return <context.Provider value={client}>{children}</context.Provider>;
}

export class QueryClient {
  constructor() {
    this.queries = [];
  }
  getQuery = (options) => {
    const queryHash = JSON.stringify(options.queryKey);
    let query = this.queries.find((d) => d.queryHash === queryHash);

    if (!query) {
      query = createQuery(this, options);
      this.queries.push(query);
    }

    return query;
  };
}

export function useQuery({ queryKey, queryFn, staleTime, cacheTime }) {
  
  const client = React.useContext(context);
  const [, rerender] = React.useReducer((i) => i + 1, 0);

  const observerRef = React.useRef();
  if (!observerRef.current) {
    observerRef.current = createQueryObserver(client, {
      queryKey,
      queryFn,
      staleTime,
      cacheTime,
    });
  }

  React.useEffect(() => {
    return observerRef.current.subscribe(rerender);
  }, []);

  return observerRef.current.getResult();
}

function createQuery(client, { queryKey, queryFn, cacheTime = 5 * 60 * 1000 }) {
  let query = {
    queryKey,
    queryHash: JSON.stringify(queryKey),
    promise: null,
    subscribers: [],
    gcTimeout: null,
    state: {
      status: "loading",
      isFetching: true,
      data: undefined,
      error: undefined,
    },
    setState: (updater) => {
      query.state = updater(query.state);
      query.subscribers.forEach((subscriber) => subscriber.notify());
    },
    subscribe: (subscriber) => {
      query.subscribers.push(subscriber);
      query.unscheduleGC();

      return () => {
        
        query.subscribers = query.subscribers.filter((d) => d !== subscriber);
        if (!query.subscribers.length) {
          query.scheduleGC();
        }
      };
    },
    scheduleGC: () => {
      query.gcTimeout = setTimeout(() => {
        client.queries = client.queries.filter((d) => d !== query);
      }, cacheTime);
    },
    unscheduleGC: () => {
      clearTimeout(query.gcTimeout);
    },
    fetch: () => {
      if (!query.promise) {
        query.promise = (async () => {
          query.setState((old) => ({
            ...old,
            isFetching: true,
            error: undefined,
          }));
          try {
            
            const data = await queryFn();

            query.setState((old) => ({
              ...old,
              status: "success",
              lastUpdated: Date.now(),
              data,
            }));
            
          } catch (error) {
            query.setState((old) => ({
              ...old,
              status: "error",
              error,
            }));
          } finally {
            query.promise = null;
            query.setState((old) => ({
              ...old,
              isFetching: false,
            }));
          }
        })();
      }

      return query.promise;
    },
  };

  return query;
}

function createQueryObserver(
  client,
  { queryKey, queryFn, staleTime = 0, cacheTime }
) {
  const query = client.getQuery({ queryKey, queryFn, cacheTime });

  const observer = {
    notify: () => {},
    getResult: () => query.state,
    subscribe: (callback) => {

      observer.notify = callback;
      const unsubscribe = query.subscribe(observer);

      observer.fetch();

      return unsubscribe;
    },
    fetch: () => {
      if (
        !query.state.lastUpdated ||
        Date.now() - query.state.lastUpdated > staleTime
      ) {
        query.fetch();
      }
    },
  };

  return observer;
}
```

詳しくは上記のサイトや動画を見てほしいのですが、Subscriptionベースのデザインパターンを使用して、クエリの実行と監視が行われています。本番環境で使用はしないでと参考にした動画内で仰っていますが、意外にも150程度の行数でuseQueryの大体の機能を再現できるのは驚きでした。気になる人は上記のコード内に適宜、debugger文を追加し、デバッグしてみるのも良いと思います。