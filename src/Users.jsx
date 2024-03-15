import React from "react";
import axios from "axios";
import { useQuery } from "./react-query-light";
import { Link } from "react-router-dom";

function usePosts() {
  return useQuery({
    queryKey: "users",
    queryFn: async () => {
      const { data } = await axios.get("https://jsonplaceholder.typicode.com/users");
      return data;
    },
    staleTime: 0,
    cacheTime: 300000,
  });
}

const App = () => {
  const postsQuery = usePosts();

  if (postsQuery.status === "loading") {
    return <div>Loading...</div>;
  }

  if (postsQuery.status === "error") {
    return <div>Error: {postsQuery.error.message}</div>;
  }

  const { data } = postsQuery;

  return (
    <div>
      <h1>Users</h1>
      <Link to="/posts">Postsコンポーネントへ飛ぶ</Link>
      {data.map((user) => (
        <p key={user.id}>{user.name}</p>
      ))}
    </div>
  );
};

export default App;
