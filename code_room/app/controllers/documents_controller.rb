# frozen_string_literal: true

class DocumentsController < ApplicationController
  def new; end

  def create
    @document = Document.create(document_params)

    render json: @document if @document
  end

  def delete
    @document = Document.find_by(id: params[:id])

    if @document
      @document.destroy
    else
      render status: 404
    end
  end

  def edit
    @document = Document.find_by(id: params[:id])
    @room = @document.room
    redirect_to user_document_room(@room)
  end

  def index
    @documents = Document.where(admin_id: params[:admin_id])

    render json: @documents
  end

  def show
    @document = Document.find_by(id: params[:id])

    if @document
      render json: @document
      respond_to do |format|
        format.js
      end
    else
      render status: 404
    end
  end

  def update
    @document = Document.find_by(id: params[:id])

    if @document.update(document_update_params)
      render json: @document
      respond_to do |format|
        format.js
      end
    else
      render status: 400
      flash.now[:errors] = @document.errors.full_messages
    end
  end
end