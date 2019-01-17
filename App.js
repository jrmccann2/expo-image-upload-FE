import React from 'react';
import axios from 'axios';
import { v4 as randomString } from 'uuid';
import { StyleSheet, Text, View, Button, StatusBar, ActivityIndicator, Clipboard, Image, Share, TouchableOpacity } from 'react-native';
import { ImagePicker, Permissions } from 'expo';

export default class App extends React.Component {
  constructor() {
    super();

    this.state = {
      url: '',
      isUploading: false
    }
  }

  getSignedRequest = (file) => {
    console.log('hit method')
    console.log({ file })
    this.setState({ isUploading: true });
    // We are creating a file name that consists of a random string, and the name of the file that was just uploaded with the spaces removed and hyphens inserted instead. This is done using the .replace function with a specific regular expression. This will ensure that each file uploaded has a unique name which will prevent files from overwriting other files due to duplicate names.

    // USE THIS TO PARSE FILE.NAME WHEN NOT IN TEST: ${file.name.replace(/\s/g, '-')}


    // We will now send a request to our server to get a "signed url" from Amazon. We are essentially letting AWS know that we are going to upload a file soon. We are only sending the file-name and file-type as strings. We are not sending the file itself at this point.
    const fileParts = file.uri.split('ImagePicker/')[1].split('.');
    const fileName = fileParts[0];
    const fileType = `image/${fileParts[1]}`
    axios
      .get(`http://192.168.1.45:3010/api/signs3`, {
        params: {
          'file-name': fileName,
          'file-type': fileType,
        },
      })
      .then(response => {
        const { signedRequest, url } = response.data;
        console.log({ signedRequest, url })
        this.uploadFile(file, fileName, fileType, signedRequest, url);
      })
      .catch(err => {
        console.log('error:', err);
      });
  };

  uploadFile = async (file, fileName, fileType, signedRequest, url) => {

    let formData = new FormData();
    formData.append('photo', {
      uri: file.uri,
      name: fileName,
      type: fileType,
    });
    console.log({ formData });

    const xhr = new XMLHttpRequest()
    xhr.open('PUT', signedRequest)
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          console.log('Image successfully uploaded to S3', url)
        } else {
        
          console.log('Error while sending the image to S3', xhr.status)
        }
      }
    }
    xhr.setRequestHeader('Content-Type', fileType)
    xhr.send({ uri: file.uri, type: fileType, name: fileName })
  };

pickImage = async () => {
  await Permissions.askAsync(Permissions.CAMERA_ROLL);
  let result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: true,
    aspect: [4, 3],
    mediaTypes: "Images",
    // base64: true,
    // exif: true
  });
  // console.log('result:', result);
  if (!result.cancelled) {
    this.setState({ url: result.uri })
    await this.getSignedRequest(result)
  }
}

maybeRenderUploadingOverlay = () => {
  if (this.state.isUploading) {
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: 'rgba(0,0,0,0.4)',
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}>
        <ActivityIndicator color="#fff" animating size="large" />
      </View>
    );
  }
};

maybeRenderImage = () => {
  let { url } = this.state;
  // console.log('url:', url)
  if (!url) {
    return;
  }

  return (
    <View
      style={{
        marginTop: 30,
        width: 250,
        borderRadius: 3,
        elevation: 2,
        shadowColor: 'rgba(0,0,0,1)',
        shadowOpacity: 0.2,
        shadowOffset: { width: 4, height: 4 },
        shadowRadius: 5,
      }}>
      <View
        style={{
          borderTopRightRadius: 3,
          borderTopLeftRadius: 3,
          overflow: 'hidden',
        }}>
        <Image source={{ uri: url }} style={{ width: 250, height: 250 }} />
      </View>

      <Text
        // onPress={this.copyToClipboard}
        // onLongPress={this.share}
        style={{ paddingVertical: 10, paddingHorizontal: 10 }}>
        {url}
      </Text>
    </View>
  );
};

render() {
  const { url, isUploading } = this.state;

  return (
    <View style={styles.container}>
      <Text>Open up App.js to start working on your app!</Text>
      <Button
        title="Gallery"
        onPress={this.pickImage}
      />

      {this.maybeRenderImage()}
      {this.maybeRenderUploadingOverlay()}

      <StatusBar barStyle="default" />
    </View>
  );
}
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
