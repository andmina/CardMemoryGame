import React from 'react';
import {
  View,
  SafeAreaView,
  StyleSheet,
  StatusBar,
  Dimensions,
  TouchableOpacity,
  Image,
  Alert,
  Animated,
} from 'react-native';

import { Entypo } from '@expo/vector-icons';
// Add image picker module to access camera and photo library
import * as ImagePicker from "expo-image-picker";

import { AVAILABLE_CARDS } from './data/availableCards';

const screen = Dimensions.get('window');
const CARD_WIDTH = Math.floor(screen.width * 0.25);
const CARD_HEIGHT = Math.floor(CARD_WIDTH * (323 / 222));

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#7CB48F',
    flex: 1,
  },
  safearea: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    marginVertical: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderColor: '#fff',
    borderWidth: 5,
    borderRadius: 3,
  },
  cardImage: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  buttons: {
    padding: 5,
    flexDirection: 'row',
    alignContent: 'center'
  }
});

const getCardColumnOffset = index => {
  switch (index) {
    case 0:
      return 2.65;
    case 1:
      return 1.325;
    case 2:
      return 0;
    default:
      return 0;
  }
};

const getCardRowOffset = index => {
  switch (index) {
    case 0:
      return -3.6;
    case 1:
      return -2.4;
    case 2:
      return -1.2;
    case 3:
      return 0;
    default:
      return 0;
  }
}

class Card extends React.Component {
  offsetX = new Animated.Value(CARD_WIDTH * getCardColumnOffset(this.props.Xindex));
  offsetY = new Animated.Value(0)

  getXYIndex = () => {
    return this.props.Xindex + 1 + (3 * this.props.Yindex)
    // switch (this.props.Yindex) {
    //   case 0:
    //     return this.props.Xindex + 1;
    //   case 1:
    //     return this.props.Xindex + 4;
    //   case 2:
    //     return this.props.Xindex + 7;
    //   case 3:
    //     return this.props.Xindex + 10;
    //   default:
    //     return 0;
    // }
  }

  componentDidMount() {
    this.timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(this.offsetX, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(this.offsetY, {
          toValue: CARD_HEIGHT * getCardRowOffset(this.props.Yindex),
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }, 100 * this.getXYIndex());
  }

  componentWillUnmount() {
    clearTimeout(this.timeout);
  }

  render() {
    const { onPress, image, isVisible } = this.props;
    let displayImage = (
      <Image source={image} style={styles.cardImage} resizeMode="contain" />
    );

    if (!isVisible) { // load default back of the card
      if (this.props.photoUri != null) { // if the state is not null and there's not a photo uri
        displayImage = (
          <Image
            // source={{ uri: photoObj.photo }}
            source={{uri: this.props.photoUri}} // add image from camera roll (uri: this.state.modalPhotoUri)
            style={styles.cardImage}
            resizeMode="cover"
          />
        );
      } else {
        displayImage = (
          <Image
            // source={{ uri: photoObj.photo }}
            source={require('./assets/card-back.png')} // add image from camera roll (uri: this.state.modalPhotoUri)
            style={styles.cardImage}
            resizeMode="contain"
          />
        );
      }
    }

    const animatedStyles = {
      transform: [
        {
          translateX: this.offsetX
        },
        {
          translateY: this.offsetY
        }
      ],
    };

    return (
      <TouchableOpacity onPress={onPress}>
        <Animated.View style={[styles.card, animatedStyles]}>
          {displayImage}
        </Animated.View>
      </TouchableOpacity>
    );
  }
}

const getRowOffset = index => {
  switch (index) {
    case 0:
      return 1.8;
    case 1:
      return 0.6;
    case 2:
      return -0.6;
    case 3:
      return -1.8;
    default:
      return 0;
  }
};

class Row extends React.Component {
  offset = new Animated.Value((CARD_HEIGHT * getRowOffset(this.props.index)) + screen.height / 3.33)

  render() {
    const animationStyles = {
      transform: [
        {
          translateY: this.offset,
        },
      ],
    };
    return (
      <Animated.View style={[styles.row, animationStyles]}>
        {this.props.children}
      </Animated.View>
    );
  }
}

const initialState = {
  data: [],
  moveCount: 0,
  selectedIndices: [],
  currentImage: null,
  matchedPairs: [],
  photoUri: null,
};

class App extends React.Component {
  state = initialState;

  componentDidMount() {
    // Image
    (async () => {
      if (Platform.OS !== "web") {
        await ImagePicker.requestCameraRollPermissionsAsync();
        await ImagePicker.requestCameraPermissionsAsync();
      }
    })();

    this.draw();
  }

  componentDidUpdate() {
    if (this.state.matchedPairs.length >= 6) {
      this.gameComplete();
    }
  }

  // PHOTO LIBRARY
  showPhotoLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync();
    await this.saveNewPhoto(result);

  };

  showCamera = async () => {
    const result = await ImagePicker.launchCameraAsync();
    await this.saveNewPhoto(result);
  };

  saveNewPhoto = async (result) => {
    if (!result.cancelled) {
      // parse to get the object from string
      this.setState({
        photoUri: result.uri
      })
    }
  };

  gameComplete = () => {
    Alert.alert(
      'Winner!',
      `You completed the puzzle in ${this.state.moveCount} moves!`,
      [
        {
          text: 'Reset Game',
          onPress: () => this.setState({ ...initialState }, () => this.draw()),
        },
      ]
    );
  };

  draw = () => {
    const possibleCards = [...AVAILABLE_CARDS];
    const selectedCards = [];

    for (let i = 0; i < 6; i += 1) {
      const randomIndex = Math.floor(Math.random() * possibleCards.length);
      const card = possibleCards[randomIndex];

      selectedCards.push(card);
      selectedCards.push(card);

      possibleCards.splice(randomIndex, 1);
    }

    selectedCards.sort(() => 0.5 - Math.random());

    const cardRow = [];
    const columnSize = 3;
    let index = 0;

    while (index < selectedCards.length) {
      cardRow.push(selectedCards.slice(index, columnSize + index));
      index += columnSize;
    }

    const data = cardRow.map((row, i) => {
      return {
        name: i,
        columns: row.map(image => ({ image })),
      };
    });

    this.setState({ data });
  };

  handleCardPress = (cardId, image) => {
    let callWithUserParams = false;
    this.setState(
      ({ selectedIndices, currentImage, matchedPairs, moveCount }) => {
        const nextState = {};

        if (selectedIndices.length > 1) {
          callWithUserParams = true;
          return { selectedIndices: [] };
        }

        nextState.moveCount = moveCount + 1;
        if (selectedIndices.length === 1) {
          if (image === currentImage && !selectedIndices.includes(cardId)) {
            nextState.currentImage = null;
            nextState.matchedPairs = [...matchedPairs, image];
          }
        } else {
          nextState.currentImage = image;
        }

        nextState.selectedIndices = [...selectedIndices, cardId];

        return nextState;
      },
      () => {
        if (callWithUserParams) {
          this.handleCardPress(cardId, image);
        }
      }
    );
  };

  render() {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.safearea}>
          <View style={styles.buttons}>
            {/* navigate to the camera */}
            <TouchableOpacity
              style={{marginRight: 10}}
              text="Take Photo"
              onPress={() => this.showCamera()}
            >
              <Entypo name="camera" size={36} color="white" />
            </TouchableOpacity>

            {/* navigate to the gallery */}
            <TouchableOpacity
              style={{marginRight: 10}}
              text="Add Photo from Library"
              onPress={() => this.showPhotoLibrary()}

            >
              <Entypo name="images" size={36} color="white" />
            </TouchableOpacity>
          </View>
          {this.state.data.map((row, rowIndex) => (
            <Row key={row.name} index={rowIndex}>
              {row.columns.map((card, index) => {
                const cardId = `${row.name}-${card.image}-${index}`;

                return (
                  <Card
                    key={cardId}
                    Xindex={index}
                    Yindex={rowIndex}
                    photoUri={this.state.photoUri}
                    onPress={() => this.handleCardPress(cardId, card.image)}
                    image={card.image}
                    isVisible={
                      this.state.selectedIndices.includes(cardId) ||
                      this.state.matchedPairs.includes(card.image)
                    }
                  />
                );
              })}
            </Row>
          ))}
        </SafeAreaView>
      </View>
    );
  }
}

export default App;
