import React from 'react';
import { Text, FlatList } from 'react-native';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';

export default function Films() {
  return (
    <Query
      query={gql`
        {
          allFilms {
            title
          }
        }
      `}
    >
      {({ loading, error, data }) => {
        if (loading) return <Text>Loading...</Text>;
        if (error) return <Text>Error</Text>;

        return (
          <FlatList
            testID="films"
            data={data.allFilms}
            keyExtractor={(item) => item.title}
            renderItem={({ item }) => (
              <Text>{item.title}</Text>
            )}
          />
        );
      }}
    </Query>
  );
}