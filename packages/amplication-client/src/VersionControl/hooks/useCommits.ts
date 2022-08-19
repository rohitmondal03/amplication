import { GET_COMMITS } from "./commitQueries";
import { useContext, useEffect, useState } from "react";
import { Commit, SortOrder } from "../../models";
import { useQuery } from "@apollo/client";
import { AppContext } from "../../context/appContext";

const useCommits = () => {
  const { currentProject } = useContext(AppContext);
  const [commits, setCommits] = useState<Commit[]>([]);

  const {
    data: commitsData,
    error: commitsError,
    loading: commitsLoading,
    refetch,
  } = useQuery(GET_COMMITS, {
    skip: !currentProject?.id && !commits.length,
    variables: {
      projectId: currentProject?.id,
      orderBy: {
        createdAt: SortOrder.Desc,
      },
    },
  });

  useEffect(() => {
    if (!commitsData) return;
    setCommits(commitsData.commits);
    refetch();
  }, [commitsData, refetch]);

  return {
    commits,
    commitsError,
    commitsLoading,
  };
};

export default useCommits;
