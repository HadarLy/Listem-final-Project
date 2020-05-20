import React from 'react'
import {Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View} from 'react-native'
import PropTypes from 'prop-types'

function UserAlert(props) {
    return <Modal visible={props.finishedCreation}
                  transparent={ true }
                  animationType={'fade'}
                  onRequestClose={props.closeModal}>
                <TouchableWithoutFeedback onPress={props.closeModal}>
                    <View style={styles.endMessage}>
                        <View style={styles.endMessageBox}>
                            <Text style={styles.endMessageText}>{props.endMessage}</Text>
                            <TouchableOpacity style={styles.okButton} onPress={props.closeModal}>
                                <Text style={styles.okButtonText}>OK</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>;
}

UserAlert.propTypes = {
    /*
    The propTypes determine which props we require from the user and which are optional.
    */
    closeModal: PropTypes.func.isRequired,
    finishedCreation: PropTypes.bool.isRequired,
    endMessage: PropTypes.string.isRequired
};

const styles=StyleSheet.create({
    endMessage:{
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(189, 195, 199, 0.8)'
    },
    endMessageBox:{
        width: 250,
        height: 130,
        backgroundColor: 'white',
        borderRadius: 10,
        elevation: 10
    },
    endMessageText:{
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'left',
        textAlignVertical: 'center',
        padding: 10
    },
    okButton: {
        alignItems:'flex-end'
    },
    okButtonText: {
        textAlign:'left',
        textAlignVertical:'center',
        padding:20,
        color:'green'
    }
});

export default UserAlert;