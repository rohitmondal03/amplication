import React, { useMemo, useState, useContext } from "react";
import { gql, useQuery } from "@apollo/client";
import classNames from "classnames";
import { isEmpty } from "lodash";
import { formatError } from "../util/error";
import * as models from "../models";
import {
  UserAndTime,
  Tooltip,
  SkeletonWrapper,
} from "@amplication/design-system";
import { ClickableId } from "../Components/ClickableId";
import BuildSummary from "./BuildSummary";
import BuildHeader from "./BuildHeader";
import "./LastCommit.scss";
import PendingChangesMenuItem from "../VersionControl/PendingChangesMenuItem";
import { AppContext } from "../context/appContext";

type TData = {
  commits: models.Commit[];
};

type Props = {
  resourceId: string;
};

const CLASS_NAME = "last-commit";

const LastCommit = ({ resourceId }: Props) => {
  const { commitRunning, pendingChangesIsError, } = useContext(AppContext);
  const [error, setError] = useState<Error>();

  const { data, loading, error: errorLoading, refetch } = useQuery<TData>(
    GET_LAST_COMMIT,
    {
      variables: {
        resourceId,
      },
    }
  );

  React.useEffect(() => {
    refetch();
    return () => {
      refetch();
    };
  }, [pendingChangesIsError, refetch]);

  const lastCommit = useMemo(() => {
    if (loading || isEmpty(data?.commits)) return null;
    const [last] = data?.commits || [];
    return last;
  }, [loading, data]);

  const build = useMemo(() => {
    if (!lastCommit) return null;
    const [last] = lastCommit.builds || [];
    return last;
  }, [lastCommit]);

  const errorMessage =
    formatError(errorLoading) || (error && formatError(error));

  const account = lastCommit?.user?.account;

  if (!lastCommit) return null;

  const ClickableCommitId = (
    <ClickableId
      to={`/${build?.resourceId}/commits/${lastCommit.id}`}
      id={lastCommit.id}
      label="Last commit"
      eventData={{
        eventName: "lastCommitIdClick",
      }}
    />
  );

  const generating = commitRunning;

  return (
    <div
      className={classNames(`${CLASS_NAME}`, {
        [`${CLASS_NAME}__generating`]: generating,
      })}
    >
      {Boolean(error) && errorMessage}

      <SkeletonWrapper showSkeleton={generating}>
        {isEmpty(lastCommit?.message) ? (
          ClickableCommitId
        ) : (
          <Tooltip aria-label={lastCommit?.message} direction="ne">
            {ClickableCommitId}
          </Tooltip>
        )}
      </SkeletonWrapper>
      <UserAndTime
        loading={generating}
        account={account}
        time={lastCommit.createdAt}
      />

      {build && (
        <>
          <SkeletonWrapper showSkeleton={generating}>
            <BuildHeader
              build={build}
              isError={pendingChangesIsError}
            />
          </SkeletonWrapper>

          <BuildSummary
            build={build}
            onError={setError}
            generating={generating}
          />
        </>
      )}

      <PendingChangesMenuItem resourceId={resourceId} />
    </div>
  );
};

export default LastCommit;

export const GET_LAST_COMMIT = gql`
  query lastCommit($resourceId: String!) {
    commits(
      where: { resource: { id: $resourceId } }
      orderBy: { createdAt: Desc }
      take: 1
    ) {
      id
      message
      createdAt
      user {
        id
        account {
          firstName
          lastName
        }
      }
      changes {
        originId
        action
        originType
        versionNumber
        origin {
          __typename
          ... on Entity {
            id
            displayName
            updatedAt
          }
          ... on Block {
            id
            displayName
            updatedAt
          }
        }
      }
      builds(orderBy: { createdAt: Desc }, take: 1) {
        id
        createdAt
        resourceId
        version
        message
        createdAt
        commitId
        actionId
        action {
          id
          createdAt
          steps {
            id
            name
            createdAt
            message
            status
            completedAt
            logs {
              id
              createdAt
              message
              meta
              level
            }
          }
        }
        createdBy {
          id
          account {
            firstName
            lastName
          }
        }
        status
        archiveURI
      }
    }
  }
`;
