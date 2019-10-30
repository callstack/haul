import React from 'react';
import { Text, FlatList } from 'react-native';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';

export default function ExchangeRates() {
  return (
    <Query
      query={gql`
        {
          allFilms {
            films {
              title
            }
          }
        }
      `}
    >
      {({ loading, error, data }) => {
        if (loading) return <Text>Loading...</Text>;
        if (error) return <Text>Error :(</Text>;

        return (
          <FlatList
            testID="exchangeRates"
            data={data.allFilms.films}
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