// TODO:
// Videos in inner-card

/*
 ################# WARING! #################
 #                                         #
 #  THIS CODE IS A FUCKING MESS,           #
 #  JUST PLAYING AROUND... I'M SORRY ^^"   #
 #                                         #
 #  by yka yudakan o3o                     #
 #                                         #
 ###########################################
*/

// Some extra utilities
if (!Array.prototype.last) {
    Array.prototype.last = function() {
        return this[this.length - 1];
    };
}

// Set positions and size of element
const setLike = (eTarget, elike) => {
    const rect = elike.getBoundingClientRect();
    eTarget.style.width = `${rect.width}px`;
    eTarget.style.height = `${rect.height}px`;
    eTarget.style.transform = `translate(${rect.x}px, ${rect.y}px)`;
}

// Get models data
const renderData = async url => {
    const res = await fetch(url);
    const json = await res.json();
    renderJSON(json);
}

// Construct page
const renderJSON = json => {

    // Global vars
    const models = json.collection;
    const title = json.title;
    const framesIndexIMG = 'img0001.png';

    // Generate HTML
    let html = '<div class="row">';
    for (let i=0; i < models.length; i++) {
        if (i%4 == 0 && i != 0) html += '</div><div class="row">';
        
        html += `<div id="col-${i}" class="col">`;
        html += `<div id="card-${i}" class="card">`;
        html += `<div id="card-inner-${i}" class="card-inner"><div class="frames" style="background-image:url('${models[i][2]}/${framesIndexIMG}')"></div></div>`;
        html += `<div id="card-footer-${i}" class="card-footer">`;
        html += `<span>${models[i][0]}</span>`;
        html += `<span>${models[i][1]}</span>`;
        html += `</div>`;
        html += `</div>`;
        html += `</div>`;
    }
    html += '</div>';
    document.getElementById('the-grid').innerHTML = html;
    document.getElementById('title').innerHTML = title;

    const updateFooter = () => {
        const footer = document.getElementsByTagName('footer')[0];
        const rect = footer.getBoundingClientRect();
        const newHeight = window.innerHeight - rect.y;
        footer.style.height = newHeight < 100 ? '100px' : `${newHeight}px`;
    }
    window.addEventListener('resize', updateFooter);
    updateFooter();
      
    // Global vars
    let mouseEvents = true;
    let actualCard = null;
    let resumeShow = false;

    const cards = Array.from(document.getElementsByClassName('card'));
    const viewer = document.getElementById('viewer');
    const viewerInner = document.getElementById('inner-viewer');
    const viewerFooter = document.getElementById('footer-viewer');
    const closeButton = document.getElementById('close-button');
    const arrowLeftButton = document.getElementById('arrow-left-button');
    const arrowRightButton = document.getElementById('arrow-right-button');
    const controls = Array.from(document.getElementsByClassName('controls'));
    const resume = document.getElementById('resume');

    // History Navegation Event
    window.addEventListener('popstate', e => {
        if (e.state === null) closeButtonAction(false);
    });

    // Model-Viewer
    const setModelViewer = id => {
        viewerInner.innerHTML = `<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">` +
                                `<div id="model-viewer-loader" class="loader">`+
                                `<span></span><span></span><span></span><span></span>` +
                                `</div></div>` +
                                `<model-viewer src="${models[id][3]}"` +
                                `ar auto-rotate camera-controls shadow-intensity="0"></model-viewer>`;
        document.getElementsByTagName('model-viewer')[0]
                .addEventListener('load', e => document.getElementById('model-viewer-loader').style.display = 'none');
    }

    // Resume action
    const resumeAction = () => {
        if (resumeShow) {
            resume.style.transform = 'translate(0px, 300px)';
            viewer.style.height = '100%';
        }
        else {
            resume.style.transform = '';
            viewer.style.height = 'calc(100% - 300px)';
        }
        resumeShow = !resumeShow;
    }

    // Arrows action
    const arrowsAction = direction => {
        // update actual card
        direction = direction === 'left';
        let id = parseInt(actualCard.id.split('-').last());
        id += direction ? -1 : 1;
        if (id < 0 || id >= models.length) return;
        mouseEvents = false;
        actualCard = document.getElementById(`card-${id}`);

        // new history state
        window.history.replaceState({actual : 'viewer'}, '', 'viewer-'+models[id][0].split(' ').join('-'));
        
        const cardFooterContent = document.getElementById(`card-footer-${id}`).cloneNode(true);
        Array.from(cardFooterContent.childNodes).forEach(n => n.style.color = 'var(--color1)');
        const rectBody = document.body.getBoundingClientRect();
        let viewerClone;
        let viewerTransitionOriginal;

        // close resume if opened
        let extraTime = 0;
        if (resumeShow) {
            resumeAction();
            extraTime += 500;
        }

        // create new viewer
        let viewerCloneHTML = `<div id="viewerClone" class="viewer" style="transform: translate(${direction ? -rectBody.width : rectBody.width}px, 0px); transition: 0.5s">`;
        viewerCloneHTML += `<div id="inner-viewerClone" class="card-inner"></div>`;
        viewerCloneHTML += `<div id="footer-viewerClone" class="card-footer">${cardFooterContent.innerHTML}</div>`;
        viewerCloneHTML += `</div>`;

        // insert new viewer
        viewer.insertAdjacentHTML('afterend', viewerCloneHTML);

        // move new viewer to screen space
        setTimeout(() => {
            viewerClone = document.getElementById('viewerClone');
            viewerClone.style.transform = 'translate(0px, 0px)';
            viewer.style.transform = `translate(${direction ? rectBody.width : -rectBody.width}px, 0px)`;
        }, extraTime+10);

        // remove transition timing
        setTimeout(() => {
            viewerTransitionOriginal = viewer.style.transition;
            viewer.style.transition = 'all 0s';
            viewerClone.style.transition = 'all 0s';
        }, extraTime+510);

        // set model-viewer - bring back original viewer
        setTimeout(() => {
            viewer.style.transform = 'translate(0px, 0px)';
            viewerFooter.innerHTML = cardFooterContent.innerHTML;
            resume.innerHTML = `<p>${models[id][4]}</p>`;
            setModelViewer(id);
        }, extraTime+520);

        // finished
        setTimeout(() => {
            viewer.style.transition = viewerTransitionOriginal;
            viewerClone.remove();

            // scroll to actual card position
            document.getElementById(`col-${id}`).scrollIntoView({behavior: 'auto', block: 'nearest', inline: 'start'});

            mouseEvents = true;
        }, extraTime+530);
    }

    // Set cards listeners
    cards.forEach(c => {

        const id = parseInt(c.id.split('-').last());
        const frames = document.querySelector(`#card-inner-${id} > .frames`);
        const cardFooter = document.getElementById(`card-footer-${id}`);
        const spans = Array.from(cardFooter.childNodes);

        // FXs hover & Show frames
        c.addEventListener('mouseover', e => {
            
            // FXs hover
            cards.forEach(cc => cc.style.filter = 'blur(1px)');
            c.style.filter = 'brightness(1.5)';
            spans.forEach(n => n.style.color = 'var(--color1)');
        });
        c.addEventListener('mousemove', e => {

            // Show frames
            const rect = c.getBoundingClientRect();
            let relative_x = (e.x - rect.x) * 10 / rect.width;
            relative_x = relative_x <= 0 ? 1 : 10-relative_x;
            frames.style.backgroundImage = `url('${models[id][2]}/img${Math.ceil(relative_x).toString().padStart(4, '0')}.png')`;
        });
        c.addEventListener('mouseleave', e => {

            // FXs hover
            cards.forEach(cc => cc.style.filter = '');
            spans.forEach(n => n.style.color = '');

            // Show frames restore
            frames.style.backgroundImage = `url('${models[id][2]}/${framesIndexIMG}')`;
        });

        // Click to viewer
        c.addEventListener('click', e => {
            mouseEvents = false;
            actualCard = c;
            document.body.style.overflowY = 'hidden';
            document.documentElement.style.overflowY = 'hidden';

            // new history state
            window.history.pushState({actual : 'viewer'}, '', 'viewer-'+models[id][0].split(' ').join('-'));

            // set cards transition timing
            cards.forEach(cc => cc.style.transition = '1.25s');

            // start!
            setTimeout(() => {
                // move cards, header & footer
                cards.filter(cc => cc.id !== c.id).forEach(cc =>
                    id > parseInt(cc.id.split('-').last()) ?
                        cc.style.transform = 'translate(0px, -1080px)' : cc.style.transform = 'translate(0px, 1080px)'
                );
                document.getElementsByTagName('header')[0].style.transform = 'translate(0px, -1080px)';
                document.getElementsByTagName('footer')[0].style.transform = 'translate(0px, 1080px)';

                // set viewer like actual card
                viewerFooter.innerHTML = document.getElementById(`card-footer-${id}`).innerHTML;
                setLike(viewer, c);
                viewer.style.display = 'block';
                c.style.opacity = '0';
                viewer.style.transition = 'all 0.5s, width 0.1s';
            }, 10);

            // viewer animation to right
            setTimeout(() => {
                const rectViewer = viewer.getBoundingClientRect();
                const rectBody = document.body.getBoundingClientRect();
                viewer.style.transform = `translate(${rectBody.width-rectViewer.width}px, ${rectViewer.y}px)`;
            }, 110);

            // viewer animation full height
            setTimeout(() => {
                const rectViewer = viewer.getBoundingClientRect();
                const rectBody = document.body.getBoundingClientRect();
                viewer.style.height = '100%';
                viewer.style.transform = `translate(${rectBody.width-rectViewer.width}px, 0px)`;
            }, 610);

            // viewer animation full width
            setTimeout(() => {
                viewer.style.width = '100%';
                viewer.style.transform = `translate(0px, 0px)`;
                controls.forEach(ct => ct.style.opacity = '0');
                controls.forEach(ct => ct.style.display = 'block');
            }, 1110);

            // set model-viewer
            setTimeout(() => {
                controls.forEach(ct => ct.style.opacity = '1');
                resume.innerHTML = `<p>${models[id][4]}</p>`;
                resume.style.display= 'block';
                setModelViewer(id);

                cards.forEach(cc => {
                    cc.style.filter = '';
                    cc.style.transition = 'all 0s';
                });
                spans.forEach(n => n.style.color = '');
                mouseEvents = true;
            }, 1610);
        });
    });

    const closeButtonAction = tobackHistory => {
        mouseEvents = false;
        const id = parseInt(actualCard.id.split('-').last());
        let rectCard;

        if (tobackHistory) window.history.back();

        // start removing model-viewer & exiting
        if (resumeShow) resumeAction();
        document.getElementsByTagName('model-viewer')[0].style.opacity = '0';
        controls.forEach(ct => ct.style.opacity = '0');
        viewer.style.transition = 'all 0.5s, width 0.6s';

        // update all cards
        cards.forEach(cc => {
            if (id > parseInt(cc.id.split('-').last())) {
                cc.style.transform = 'translate(0px, -1080px)';
                cc.style.opacity = '1';
            }
            else {
                cc.style.transform = 'translate(0px, 1080px)';
                cc.style.opacity = '1';
            }
        });
        actualCard.style.transform = '';
        actualCard.style.opacity = '0';

        // viewer animation return to right
        setTimeout(() => {
            const rectBody = document.body.getBoundingClientRect();
            rectCard = actualCard.getBoundingClientRect();

            viewer.style.width = `${rectCard.width}px`;
            viewer.style.transform = `translate(${rectBody.width-rectCard.width}px, 0px)`;
            controls.forEach(ct => ct.style.display = 'none');
            viewerInner.innerHTML = '';
            resume.style.display= 'none';
        }, 500);

        // viewer animation return to card height
        setTimeout(() => {
            const rectBody = document.body.getBoundingClientRect();
            viewer.style.height = `${rectCard.height}px`;
            viewer.style.transform = `translate(${rectBody.width-rectCard.width}px, ${rectCard.y}px)`;
            cards.forEach(cc => cc.style.transition = 'all 1.25s, opacity 0s');
        }, 1000);

        // viewer animation return like card
        setTimeout(() => {
            viewer.style.transform = `translate(${rectCard.x}px, ${rectCard.y}px)`;

            // return all cards
            cards.filter(cc => cc.id !== actualCard.id).forEach(cc => cc.style.transform = '');
            document.getElementsByTagName('header')[0].style.transform = '';
            document.getElementsByTagName('footer')[0].style.transform = '';
        }, 1500);

        // finished
        setTimeout(() => actualCard.style.opacity = '1', 2000);
        setTimeout(() => {
            cards.forEach(cc => cc.style.transition = '');
            viewer.style.display = 'none';
            viewerFooter.innerHTML = '';
            document.body.style.overflowY = 'auto';
            document.documentElement.style.overflowY = 'auto';
            actualCard = null;
            mouseEvents = true;
        }, 2100);
    };

    // Close Button
    closeButton.addEventListener('click', e => closeButtonAction(true));

    // Resume section - footer viewer click
    viewerFooter.addEventListener('click', e => resumeAction());

    // Left & Right arrows click
    arrowLeftButton.addEventListener('click', e => arrowsAction('left'));
    arrowRightButton.addEventListener('click', e => arrowsAction('right'));

    // Stop mouse events propagation -> mouseEvents
    document.addEventListener('click', e => {
        if (!mouseEvents) {
            e.stopPropagation();
            e.preventDefault();
        }
    }, true);
    document.addEventListener('mouseover', e => {
        if (!mouseEvents) {
            e.stopPropagation();
            e.preventDefault();
        }
    }, true);
    document.addEventListener('mouseleave', e => {
        if (!mouseEvents) {
            e.stopPropagation();
            e.preventDefault();
        }
    }, true);
}

// LOAD DATA!
let dataset = new URL(window.location.href).searchParams.get('dataset');
if (dataset === null) {
    document.getElementById('tutorial').style.display = 'block';
    document.getElementById('loading-content').style.display = 'none';
}
else {
    if (dataset === 'test') dataset = 'models/modelsToLoad.json';
    const render = renderData(dataset);
    window.onload = () => {
        render.then(() => {
            setTimeout(() => {
                document.getElementById('loading').style.opacity = '0';
                setTimeout((() => document.getElementById('loading').style.display = 'none'), 250);
            }, 1000); // uh... this animation is cool o3o
        });
    };
}