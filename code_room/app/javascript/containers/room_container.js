import { connect } from 'react-redux';
import Room from '../components/room';

const mapStateToProps = (state) => ({
  user: state.user,
  documents: state.documents
});

const RoomContainer = connect(mapStateToProps)(Room);

export default RoomContainer;
