import React from "react";
import axios from "axios";
import { useQuery } from "./react-query-light";
import { Link } from "react-router-dom";

function usePosts() {
  return useQuery({
    queryKey: "posts",
    queryFn: async () => {
      const { data } = await axios.get("https://jsonplaceholder.typicode.com/posts");
      return data;
    },
    staleTime: 0,
    cacheTime: 300000,
  });
}

const Posts = () => {
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
      <h1>Posts</h1>
      <Link to="/">Usersコンポーネントへ飛ぶ</Link>
      {data.map((post) => (
        <p key={post.id}>{post.title}</p>
      ))}
    </div>
  );
};

export default Posts;
