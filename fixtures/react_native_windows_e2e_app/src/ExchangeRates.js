import React from 'react';
import { Text, FlatList } from 'react-native';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';

export default function ExchangeRates() {
  return (
    <Query
      query={gql`
        {
          rates(currency: "USD") {
            currency
            rate
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
            data={data.rates}
            keyExtractor={(item) => item.currency}
            renderItem={({ item }) => (
              <Text>{item.currency}: {item.rate}</Text>
            )}
          />
        );
      }}
    </Query>
  );
}