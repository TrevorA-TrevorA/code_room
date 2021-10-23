class EditorsChannel < ApplicationCable::Channel
  def subscribed
    stream_from "editors_channel_#{params[:document_id]}"
    @editors = Collaboration.where(document_id: params[:document_id]).map do |collab|
      User.find(collab.editor_id)
    end
    
    ActionCable.server.broadcast("editors_channel_#{params[:document_id]}", { editors: @editors })
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end
end