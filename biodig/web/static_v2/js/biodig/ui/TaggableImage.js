var deps = [
    'jquery', 'underscore', 'biodig/ui/Zoomable', 'biodig/ui/TagBoard',
    'biodig/storage/ImageDao', 'biodig/ui/ImageMenu',
    'lib/util', 'text!biodig/tmpl/taggable.html'
];

define(deps, function($, _, Zoomable, TagBoard, ImageDao, ImageMenu, util, TaggableTmpl) {

    var ACCEPTED_MODES = {
        REGISTERED: 'REGISTERED',
        PUBLIC: 'PUBLIC'
    };

    var TaggableTemplate = _.template(TaggableTmpl);

    function TaggableImage(selector, opts) {
        // check to see if features were directly requested
        // otherwise use the "mode" to determine the feature set
        this.image = selector;
        this.$image = $(selector);
        this.image_id = this.$image.data('image-id') || opts.image_id;
        if (!this.image_id) {
            throw {
                'detail' : "No image_id given for the TaggableImage interface"
            };
        }

        // sets up the UI for the taggable plugin initially
        this.$container = this.$image.parent();
        this.$contents = $(TaggableTemplate());

        // define the three sections of the UI
        this.$left = this.$contents.children('.taggable-left');
        this.$right = this.$contents.children('.taggable-right');
        this.$toolbar = this.$contents.children('.toolbar-container');


        if (!ACCEPTED_MODES[opts.mode]) opts.mode = ACCEPTED_MODES.REGISTERED;

        this.$container.find('*').not(this.$image).remove();
        this.$container.prepend(this.$contents);
        // relocate the image to the left side
        this.$left.append(this.$image);

        // install the public features

        // creates a canvas with methods for viewing tags and selecting them
        this.zoomable = Zoomable.create(this.image, opts);
        this.tagBoard = TagBoard.create(this.$image, opts);

        // create the image data manager for storing the current internal
        // state of the image's data
        this.imageDao = ImageDao.create(this.image_id);

        // creates the correct menu for the given mode
        this.menu = ImageMenu.create(this.$toolbar, opts.mode);
        util.scope(this, TaggableImageHelper.addPublicControls).call();

        // optionally install the registered features
        if (opts.mode == ACCEPTED_MODES.REGISTERED) {
            // creates a canvas with methods for drawing tags
            //this.drawingBoard = DrawingBoard.create(this.$image);
            //this.drawingUI = DrawingUI.create('hidden');

            //util.scope(this, TaggableImageHelper.addRegisteredControls).call();
        }
    }

    var TaggableImageHelper = {
        addPublicControls: function() {
            var self = this;

            // toggles the visibility of the tags for the currently selected tag groups
            this.menu.section('tools').item('toggleTags').click(function() {
                $.when(self.imageDao.tags(self.tagBoard.currentTagGroups))
                    .done(function(tags) {
                        self.tagBoard.draw(tags);
                    })
                    .fail(function(e) {
                        console.error(e.detail);
                    });
            });

            // shows the download dialog for downloading image metadata
            this.menu.section('tools').item('download').click(function() {
                self.dialogs.show('download');
            });

            this.menu.section('tools').item('zoomIn').click(function() {
                self.zoomable.zoom(1);
            });

            this.menu.section('tools').item('zoomOut').click(function() {
                self.zoomable.zoom(-1);
            });

            this.menu.section('tagGroups').item('changeCurrentGroups').click(function() {
                self.dialogs.show('changeCurrentGroups');
            });
        },
        addRegisteredControls: function() {
            // TODO: implement these features
        }
    }

    return {
        create: function(selector, opts) {
            var defaults = {
                'mode': 'registered' // registered or public
            };

            $.extend(defaults, opts);

            return new TaggableImage(selector, defaults);
        },
        MODES: ACCEPTED_MODES
    }
});
