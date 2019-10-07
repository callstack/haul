// createAppContainer, createBottomTabNavigator, NavigationActions
import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';

export const NavigationActions = {};

export function createBottomTabNavigator(config, options) {
    class BottomTabNavigator extends React.Component {
        state = {
            activeTab: options.initialRouteName,
            navigationState: {
                params: {}
            }
        };

        dispatch() {
            // noop
        }

        getNavigation() {
            return {
                setParams: (params) => {
                    this.setState(state => ({
                        navigationState: {
                            ...state.navigationState,
                            params: {
                                ...state.navigationState.params,
                                ...params,
                            },
                        },
                    }));
                },
                state: this.state.navigationState,
            };
        }

        render() {
            const tabConfig = config[this.state.activeTab];
            let TabComponent;
            if (typeof tabConfig === 'function') {
                TabComponent = tabConfig;
            } else {
                TabComponent = tabConfig.screen;
            }

            return (
                <View style={{ width: '100%', height: '100%' }}>
                    <View style={{ flexGrow: 1, width: '100%' }}>
                        <TabComponent navigation={this.getNavigation()} />
                    </View>
                    <View style={{
                        width: '100%',
                        flexDirection: 'row',
                        justifyContent: 'space-around',
                    }}>
                        {Object.keys(config).map(name => (
                            <TouchableOpacity testID={`navigateTo${name}`} key={name} onPress={() => {
                                if (
                                    config[name].navigationOptions &&
                                    config[name].navigationOptions.tabBarOnPress
                                ) {
                                    config[name].navigationOptions.tabBarOnPress({
                                        navigation: this.getNavigation(),
                                        defaultHandler: () => {
                                            this.setState({ activeTab: name });
                                        }
                                    })

                                } else {
                                    this.setState({ activeTab: name });
                                }
                            }}>
                                <Text>{name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            );
        }
    }

    return BottomTabNavigator;
}

export function createAppContainer(RootNavigator) {
    return RootNavigator;
}