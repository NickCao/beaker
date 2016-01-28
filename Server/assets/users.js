
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation; either version 2 of the License, or
// (at your option) any later version.

;(function () {

window.UserView = Backbone.View.extend({
    template: JST['user'],
    events: {
        'click .edit': 'edit',
        'submit .password-reset form': 'set_password',
        'click .disable': 'disable',
        'click .enable': 'enable',
        'click .delete': 'delete',
        'click .undelete': 'undelete',
    },
    initialize: function() {
        this.render();
        this.listenTo(this.model, 'change', this.render);
    },
    render: function () {
        this.$el.html(this.template(this.model.attributes));
    },
    edit: function () {
        new UserDetailsModal({model: this.model});
    },
    set_password: function (evt) {
        evt.preventDefault();
        var $form = $(evt.currentTarget);
        $form.find('button').button('loading');
        $form.find('.alert-error').remove();
        var new_password = $form.find('[name=password]').val();
        this.model.save({password: new_password}, {patch: true, wait: true})
            // Unlike the other methods, which always cause a change event 
            // hence re-render this whole widget, setting the password does not 
            // necessarily do that because the password is not actually an 
            // attribute on the model. So we have to explicitly reset the form.
            .always(function () {
                $form.find('[name=password]').val('');
                $form.find('button').button('reset');
            })
            .fail(function (xhr) {
                $form.append(
                    $('<div class="alert alert-error"/>')
                        .text(xhr.statusText + ': ' + xhr.responseText));
            })
            .success(function () {
                $.bootstrapGrowl('<h4>Password has been reset</h4>' +
                        'The password has been successfully changed.',
                        {type: 'success'});
            });
    },
    disable: function (evt) {
        var $btn = $(evt.currentTarget);
        $btn.button('loading');
        $btn.closest('div').find('.alert-error').remove();
        this.model.save({disabled: true}, {patch: true, wait: true})
            .fail(function (xhr) {
                $btn.button('reset');
                $btn.closest('div').append(
                    $('<div class="alert alert-error"/>')
                        .text(xhr.statusText + ': ' + xhr.responseText));
            });
    },
    enable: function (evt) {
        var $btn = $(evt.currentTarget);
        $btn.button('loading');
        $btn.closest('div').find('.alert-error').remove();
        this.model.save({disabled: false}, {patch: true, wait: true})
            .fail(function (xhr) {
                $btn.button('reset');
                $btn.closest('div').append(
                    $('<div class="alert alert-error"/>')
                        .text(xhr.statusText + ': ' + xhr.responseText));
            });
    },
    'delete': function (evt) {
        var model = this.model, $btn = $(evt.currentTarget);
        $btn.button('loading');
        $btn.closest('div').find('.alert-error').remove();
        bootbox.confirm_as_promise('<p>Are you sure you want to delete this user?</p>')
            .then(function () {
                return model.save({removed: 'now'}, {patch: true, wait: true});
            })
            .fail(function (xhr) { 
                $btn.button('reset');
                if (!_.isEmpty(xhr)) {
                    $btn.closest('div').append(
                        $('<div class="alert alert-error"/>')
                            .text(xhr.statusText + ': ' + xhr.responseText));
                }
            });
    },
    undelete: function (evt) {
        var $btn = $(evt.currentTarget);
        $btn.button('loading');
        $btn.closest('div').find('.alert-error').remove();
        this.model.save({removed: null}, {patch: true, wait: true})
            .fail(function (xhr) {
                $btn.button('reset');
                $btn.closest('div').append(
                    $('<div class="alert alert-error"/>')
                        .text(xhr.statusText + ': ' + xhr.responseText));
            });
    },
});

var UserDetailsModal = Backbone.View.extend({
    tagName: 'div',
    className: 'modal',
    template: JST['user-details'],
    events: {
        'submit form': 'submit',
        'hidden': 'remove',
    },
    initialize: function () {
        this.render();
        this.$el.modal();
        this.$('input:first').focus().select();
    },
    render: function () {
        this.$el.html(this.template(this.model.attributes));
        var model = this.model;
        this.$('[name=user_name]').val(model.get('user_name'));
        this.$('[name=display_name]').val(model.get('display_name'));
        this.$('[name=email_address]').val(model.get('email_address'));
    },
    submit: function (evt) {
        evt.preventDefault();
        this.$('.sync-status').empty();
        this.$('.modal-footer button').button('loading');
        var attributes = {
            'user_name': this.$('input[name=user_name]').val(),
            'display_name': this.$('input[name=display_name]').val(),
            'email_address': this.$('input[name=email_address]').val(),
        };
        this.model.save(attributes, {patch: true, wait: true})
            .done(_.bind(this.save_success, this))
            .fail(_.bind(this.save_error, this));
    },
    save_success: function (response, status, xhr) {
        if (xhr.getResponseHeader('Location'))
            window.location = xhr.getResponseHeader('Location');
        else
            this.$el.modal('hide');
    },
    save_error: function (xhr) {
        $('<div class="alert alert-error"/>')
            .text(xhr.statusText + ': ' + xhr.responseText)
            .appendTo(this.$('.sync-status'));
        this.$('.modal-footer button').button('reset');
    },
});

})();
