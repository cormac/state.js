/**
 * state v5 finite state machine library
 * http://www.steelbreeze.net/state.cs
 * Copyright (c) 2014-5 Steelbreeze Limited
 * Licensed under the MIT and GPL v3 licences
 */
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/**
 * Default namespace for the state.js classes.
 * @module fsm
 */
var fsm;
(function (fsm) {
    var Visitor = (function () {
        function Visitor() {
        }
        Visitor.prototype.visitElement = function (element, param) {
        };
        Visitor.prototype.visitRegion = function (region, param) {
            this.visitElement(region, param);
            for (var i = 0, l = region.vertices.length; i < l; i++) {
                region.vertices[i].accept(this, param);
            }
        };
        Visitor.prototype.visitVertex = function (vertex, param) {
            this.visitElement(vertex, param);
            for (var i = 0, l = vertex.transitions.length; i < l; i++) {
                vertex.transitions[i].accept(this, param);
            }
        };
        Visitor.prototype.visitPseudoState = function (pseudoState, param) {
            this.visitVertex(pseudoState, param);
        };
        Visitor.prototype.visitState = function (state, param) {
            this.visitVertex(state, param);
            for (var i = 0, l = state.regions.length; i < l; i++) {
                state.regions[i].accept(this, param);
            }
        };
        Visitor.prototype.visitFinalState = function (finalState, param) {
            this.visitState(finalState, param);
        };
        Visitor.prototype.visitStateMachine = function (stateMachine, param) {
            this.visitState(stateMachine, param);
        };
        Visitor.prototype.visitTransition = function (transition, param) {
        };
        return Visitor;
    })();
    fsm.Visitor = Visitor;
    var Behaviour = (function () {
        function Behaviour() {
        }
        return Behaviour;
    })();
    var BootstrapTransitions = (function (_super) {
        __extends(BootstrapTransitions, _super);
        function BootstrapTransitions() {
            _super.apply(this, arguments);
        }
        BootstrapTransitions.prototype.visitTransition = function (transition, elementBehaviour) {
            // internal transitions: just perform the actions; no exiting or entering states
            if (transition.target === null) {
                transition.traverse = transition.transitionBehavior;
            }
            else if (transition.target.getParent() === transition.source.getParent()) {
                transition.traverse = transition.source.leave.concat(transition.transitionBehavior).concat(transition.target.enter);
            }
            else {
                var sourceAncestors = transition.source.ancestors();
                var targetAncestors = transition.target.ancestors();
                var sourceAncestorsLength = sourceAncestors.length;
                var targetAncestorsLength = targetAncestors.length;
                var i = 0, l = Math.min(sourceAncestorsLength, targetAncestorsLength);
                while ((i < l) && (sourceAncestors[i] === targetAncestors[i])) {
                    i++;
                }
                // validate transition does not cross sibling regions boundaries
                assert(!(sourceAncestors[i] instanceof Region), "Transitions may not cross sibling orthogonal region boundaries");
                // leave the first uncommon ancestor
                transition.traverse = (i < sourceAncestorsLength ? sourceAncestors[i] : transition.source).leave.slice(0);
                // perform the transition action
                transition.traverse = transition.traverse.concat(transition.transitionBehavior);
                if (i >= targetAncestorsLength) {
                    transition.traverse = transition.traverse.concat(transition.target.beginEnter);
                }
                while (i < targetAncestorsLength) {
                    var element = targetAncestors[i++];
                    var next = i < targetAncestorsLength ? targetAncestors[i] : undefined;
                    transition.traverse = transition.traverse.concat(element.beginEnter);
                    if (element instanceof State) {
                        var state = element;
                        if (state.isOrthogonal()) {
                            for (var ii = 0, ll = state.regions.length; ii < ll; ii++) {
                                var region = state.regions[ii];
                                if (region !== next) {
                                    transition.traverse = transition.traverse.concat(region.enter);
                                }
                            }
                        }
                    }
                }
                // trigger cascade
                transition.traverse = transition.traverse.concat(transition.target.endEnter);
            }
        };
        return BootstrapTransitions;
    })(Visitor);
    var Bootstrap = (function (_super) {
        __extends(Bootstrap, _super);
        function Bootstrap() {
            _super.apply(this, arguments);
        }
        Bootstrap.prototype.elementBehaviour = function (element) {
            // TODO: complete
            return;
        };
        Bootstrap.prototype.visitStateMachine = function (stateMachine, deepHistoryAbove) {
            stateMachine.accept(Bootstrap.bootstrapTransitions, this.elementBehaviour);
        };
        Bootstrap.bootstrapTransitions = new BootstrapTransitions();
        return Bootstrap;
    })(Visitor);
    /**
     * An abstract class used as the base for the Region and Vertex classes.
     * An element is any part of the tree structure that represents a composite state machine model.
     * @class Element
     */
    var Element = (function () {
        function Element(name) {
            this.name = name;
            this.leave = [];
            this.beginEnter = [];
            this.endEnter = [];
            this.enter = [];
        }
        Element.prototype.getParent = function () {
            return;
        };
        Element.prototype.root = function () {
            return this.getParent().root();
        };
        Element.prototype.ancestors = function () {
            return (this.getParent() ? this.getParent().ancestors() : []).concat(this);
        };
        Element.prototype.isActive = function (instance) {
            return this.getParent().isActive(instance);
        };
        Element.prototype.reset = function () {
            this.leave = [];
            this.beginEnter = [];
            this.endEnter = [];
            this.enter = [];
        };
        Element.prototype.bootstrap = function (deepHistoryAbove) {
            this.qualifiedName = this.ancestors().map(function (e) {
                return e.name;
            }).join(Element.namespaceSeparator);
            // Put these lines back for debugging
            //this.leave.push((message: any, instance: IActiveStateConfiguration) => { console.log(instance + " leave " + this); });
            //this.beginEnter.push((message: any, instance: IActiveStateConfiguration) => { console.log(instance + " enter " + this); });
            this.enter = this.beginEnter.concat(this.endEnter);
        };
        /**
         * Returns a the element name as a fully qualified namespace.
         * @method toString
         * @returns {string}
         */
        Element.prototype.toString = function () {
            return this.qualifiedName;
        };
        /**
         * The symbol used to separate element names within a fully qualified name.
         * Change this static member to create different styles of qualified name generated by the toString method.
         * @member {string}
         */
        Element.namespaceSeparator = ".";
        return Element;
    })();
    fsm.Element = Element;
    /**
     * An element within a state machine model that is a container of Vertices.
     *
     * Regions are implicitly inserted into composite state machines as a container for vertices.
     * They only need to be explicitly defined if orthogonal states are required.
     *
     * Region extends the Element class and inherits its public interface.
     * @class Region
     * @augments Element
     */
    var Region = (function (_super) {
        __extends(Region, _super);
        /**
         * Creates a new instance of the Region class.
         * @param {string} name The name of the region.
         * @param {State} parent The parent state that this region will be a child of.
         */
        function Region(name, parent) {
            _super.call(this, name);
            this.parent = parent;
            // NOTE: would like an equivalent of internal or package-private
            this.vertices = [];
            parent.regions.push(this);
            parent.root().clean = false;
        }
        Region.prototype.getParent = function () {
            return this.parent;
        };
        /**
         * Tests a region to determine if it is deemed to be complete.
         * A region is complete if its current state is final (a state having on outbound transitions).
         * @method isComplete
         * @param {IActiveStateConfiguration} instance The object representing a particular state machine instance.
         * @returns {boolean} True if the region is deemed to be complete.
         */
        Region.prototype.isComplete = function (instance) {
            return instance.getCurrent(this).isFinal();
        };
        Region.prototype.bootstrap = function (deepHistoryAbove) {
            var _this = this;
            for (var i = 0, l = this.vertices.length; i < l; i++) {
                this.vertices[i].reset();
                this.vertices[i].bootstrap(deepHistoryAbove || (this.initial && this.initial.kind === 2 /* DeepHistory */));
            }
            this.leave.push(function (message, instance, history) {
                var current = instance.getCurrent(_this);
                if (current.leave) {
                    invoke(current.leave, message, instance, history);
                }
            });
            if (deepHistoryAbove || !this.initial || this.initial.isHistory()) {
                this.endEnter.push(function (message, instance, history) {
                    var ini = _this.initial;
                    if (history || _this.initial.isHistory()) {
                        ini = instance.getCurrent(_this) || _this.initial;
                    }
                    invoke(ini.enter, message, instance, history || (_this.initial.kind === 2 /* DeepHistory */));
                });
            }
            else {
                this.endEnter = this.endEnter.concat(this.initial.enter);
            }
            _super.prototype.bootstrap.call(this, deepHistoryAbove);
        };
        Region.prototype.evaluate = function (message, instance) {
            return instance.getCurrent(this).evaluate(message, instance);
        };
        Region.prototype.accept = function (visitor, param) {
            visitor.visitRegion(this, param);
        };
        /**
         * The name given to regions that are are created automatically when a state is passed as a vertex's parent.
         * Regions are automatically inserted into state machine models as the composite structure is built; they are named using this static member.
         * Update this static member to use a different name for default regions.
         * @member {string}
         */
        Region.defaultName = "default";
        return Region;
    })(Element);
    fsm.Region = Region;
    /**
     * An abstract element within a state machine model that can be the source or target of a transition (states and pseudo states).
     *
     * Vertex extends the Element class and inherits its public interface.
     * @class Vertex
     * @augments Element
     */
    var Vertex = (function (_super) {
        __extends(Vertex, _super);
        function Vertex(name, parent) {
            _super.call(this, name);
            this.transitions = [];
            if (parent instanceof Region) {
                this.region = parent;
            }
            else if (parent instanceof State) {
                this.region = parent.defaultRegion();
            }
            if (this.region) {
                this.region.vertices.push(this);
                this.region.root().clean = false;
            }
        }
        Vertex.prototype.getParent = function () {
            return this.region;
        };
        /**
         * Tests the vertex to determine if it is deemed to be complete.
         * Pseudo states and simple states are always deemed to be complete.
         * Composite states are deemed to be complete when all its child regions all are complete.
         * @method isComplete
         * @param {IActiveStateConfiguration} instance The object representing a particular state machine instance.
         * @returns {boolean} True if the vertex is deemed to be complete.
         */
        Vertex.prototype.isComplete = function (instance) {
            return;
        };
        /**
         * Creates a new transition from this vertex.
         * Newly created transitions are completion transitions; they will be evaluated after a vertex has been entered if it is deemed to be complete.
         * Transitions can be converted to be event triggered by adding a guard condition via the transitions `where` method.
         * @method to
         * @param {Vertex} target The destination of the transition; omit for internal transitions.
         * @returns {Transition} The new transition object.
         */
        Vertex.prototype.to = function (target) {
            var transition = new Transition(this, target);
            this.transitions.push(transition);
            this.root().clean = false;
            return transition;
        };
        Vertex.prototype.bootstrap = function (deepHistoryAbove) {
            var _this = this;
            _super.prototype.bootstrap.call(this, deepHistoryAbove);
            this.endEnter.push(function (message, instance, history) {
                _this.evaluateCompletions(message, instance, history);
            });
            this.enter = this.beginEnter.concat(this.endEnter);
        };
        Vertex.prototype.evaluateCompletions = function (message, instance, history) {
            if (this.isComplete(instance)) {
                this.evaluate(this, instance);
            }
        };
        Vertex.prototype.select = function (message, instance) {
            return; // NOTE: abstract method
        };
        Vertex.prototype.evaluate = function (message, instance) {
            var transition = this.select(message, instance);
            if (!transition) {
                return false;
            }
            invoke(transition.traverse, message, instance, false);
            return true;
        };
        Vertex.prototype.accept = function (visitor, param) {
            // NOTE: abstract method
        };
        return Vertex;
    })(Element);
    fsm.Vertex = Vertex;
    /**
     * An enumeration of static constants that dictates the precise behaviour of pseudo states.
     *
     * Use these constants as the `kind` parameter when creating new `PseudoState` instances.
     * @class PseudoStateKind
     */
    (function (PseudoStateKind) {
        /**
         * Used for pseudo states that are always the staring point when entering their parent region.
         * @member {number} Initial
         */
        PseudoStateKind[PseudoStateKind["Initial"] = 0] = "Initial";
        /**
         * Used for pseudo states that are the the starting point when entering their parent region for the first time; subsequent entries will start at the last known state.
         * @member {number} ShallowHistory
         */
        PseudoStateKind[PseudoStateKind["ShallowHistory"] = 1] = "ShallowHistory";
        /**
         * As per `ShallowHistory` but the history semantic cascades through all child regions irrespective of their initial pseudo state kind.
         * @member {number} DeepHistory
         */
        PseudoStateKind[PseudoStateKind["DeepHistory"] = 2] = "DeepHistory";
        /**
         * Enables a dynamic conditional branches; within a compound transition.
         * All outbound transition guards from a Choice are evaluated upon entering the PseudoState:
         * if a single transition is found, it will be traversed;
         * if many transitions are found, an arbitary one will be selected and traversed;
         * if none evaluate true, and there is no 'else transition' defined, the machine is deemed illformed and an exception will be thrown.
         * @member {number} Choice
         */
        PseudoStateKind[PseudoStateKind["Choice"] = 3] = "Choice";
        /**
         * Enables a static conditional branches; within a compound transition.
         * All outbound transition guards from a Choice are evaluated upon entering the PseudoState:
         * if a single transition is found, it will be traversed;
         * if many or none evaluate true, and there is no 'else transition' defined, the machine is deemed illformed and an exception will be thrown.
         * @member {number} Junction
         */
        PseudoStateKind[PseudoStateKind["Junction"] = 4] = "Junction";
        /**
         * Entering a terminate `PseudoState` implies that the execution of this state machine by means of its state object is terminated.
         * @member {number} Terminate
         */
        PseudoStateKind[PseudoStateKind["Terminate"] = 5] = "Terminate";
    })(fsm.PseudoStateKind || (fsm.PseudoStateKind = {}));
    var PseudoStateKind = fsm.PseudoStateKind;
    /**
     * An element within a state machine model that represents an transitory Vertex within the state machine model.
     *
     * Pseudo states are required in all state machine models; at the very least, an `Initial` pseudo state is the default stating state when the parent region is entered.
     * Other types of pseudo state are available; typically for defining history semantics or to facilitate more complex transitions.
     * A `Terminate` pseudo state kind is also available to immediately terminate processing within the entire state machine instance.
     *
     * PseudoState extends the Vertex class and inherits its public interface.
     * @class PseudoState
     * @augments Vertex
     */
    var PseudoState = (function (_super) {
        __extends(PseudoState, _super);
        /**
         * Creates a new instance of the PseudoState class.
         * @param {string} name The name of the pseudo state.
         * @param {Element} parent The parent element that this pseudo state will be a child of.
         * @param {PseudoStateKind} kind Determines the behaviour of the PseudoState.
         */
        function PseudoState(name, parent, kind) {
            _super.call(this, name, parent);
            this.kind = kind;
            if (this.isInitial()) {
                this.region.initial = this;
            }
        }
        /**
         * Tests the vertex to determine if it is deemed to be complete.
         * Pseudo states and simple states are always deemed to be complete.
         * Composite states are deemed to be complete when all its child regions all are complete.
         * @method isComplete
         * @param {IActiveStateConfiguration} instance The object representing a particular state machine instance.
         * @returns {boolean} True if the vertex is deemed to be complete.
         */
        PseudoState.prototype.isComplete = function (instance) {
            return true;
        };
        PseudoState.prototype.isHistory = function () {
            return this.kind === 2 /* DeepHistory */ || this.kind === 1 /* ShallowHistory */;
        };
        PseudoState.prototype.isInitial = function () {
            return this.kind === 0 /* Initial */ || this.isHistory();
        };
        PseudoState.prototype.bootstrap = function (deepHistoryAbove) {
            _super.prototype.bootstrap.call(this, deepHistoryAbove);
            if (this.kind === 5 /* Terminate */) {
                this.enter.push(function (message, instance, history) {
                    instance.isTerminated = true;
                });
            }
        };
        PseudoState.prototype.select = function (message, instance) {
            switch (this.kind) {
                case 0 /* Initial */:
                case 2 /* DeepHistory */:
                case 1 /* ShallowHistory */:
                    if (this.transitions.length === 1) {
                        return this.transitions[0];
                    }
                    else {
                        throw "Initial transition must have a single outbound transition from " + this.qualifiedName;
                    }
                case 4 /* Junction */:
                    var result, elseResult;
                    for (var i = 0, l = this.transitions.length; i < l; i++) {
                        if (this.transitions[i].guard === Transition.isElse) {
                            if (elseResult) {
                                throw "Multiple outbound transitions evaluated true";
                            }
                            elseResult = this.transitions[i];
                        }
                        else if (this.transitions[i].guard(message, instance)) {
                            if (result) {
                                throw "Multiple outbound transitions evaluated true";
                            }
                            result = this.transitions[i];
                        }
                    }
                    return result || elseResult;
                case 3 /* Choice */:
                    var results = [];
                    for (var i = 0, l = this.transitions.length; i < l; i++) {
                        if (this.transitions[i].guard === Transition.isElse) {
                            if (elseResult) {
                                throw "Multiple outbound else transitions found at " + this + " for " + message;
                            }
                            elseResult = this.transitions[i];
                        }
                        else if (this.transitions[i].guard(message, instance)) {
                            results.push(this.transitions[i]);
                        }
                    }
                    return results.length !== 0 ? results[Math.round((results.length - 1) * Math.random())] : elseResult;
                default:
                    return null;
            }
        };
        PseudoState.prototype.accept = function (visitor, param) {
            visitor.visitPseudoState(this, param);
        };
        return PseudoState;
    })(Vertex);
    fsm.PseudoState = PseudoState;
    /**
     * An element within a state machine model that represents an invariant condition within the life of the state machine instance.
     *
     * States are one of the fundamental building blocks of the state machine model.
     * Behaviour can be defined for both state entry and state exit.
     *
     * State extends the Vertex class and inherits its public interface.
     * @class State
     * @augments Vertex
     */
    var State = (function (_super) {
        __extends(State, _super);
        /**
         * Creates a new instance of the State class.
         * @param {string} name The name of the state.
         * @param {Element} parent The parent state that owns the state.
         */
        function State(name, parent) {
            _super.call(this, name, parent);
            this.exitBehavior = [];
            this.entryBehavior = [];
            this.regions = [];
        }
        State.prototype.defaultRegion = function () {
            var region;
            for (var i = 0, l = this.regions.length; i < l; i++) {
                if (this.regions[i].name === Region.defaultName) {
                    region = this.regions[i];
                }
            }
            if (!region) {
                region = new Region(Region.defaultName, this);
            }
            return region;
        };
        State.prototype.isActive = function (instance) {
            return _super.prototype.isActive.call(this, instance) && instance.getCurrent(this.region) === this;
        };
        /**
         * Tests the state to see if it is a final state;
         * a final state is one that has no outbound transitions.
         * @method isFinal
         * @returns {boolean} True if the state is a final state.
         */
        State.prototype.isFinal = function () {
            return this.transitions.length === 0;
        };
        /**
         * Tests the state to see if it is a simple state;
         * a simple state is one that has no child regions.
         * @method isSimple
         * @returns {boolean} True if the state is a simple state.
         */
        State.prototype.isSimple = function () {
            return this.regions.length === 0;
        };
        /**
         * Tests the state to see if it is a composite state;
         * a composite state is one that has one or more child regions.
         * @method isComposite
         * @returns {boolean} True if the state is a composite state.
         */
        State.prototype.isComposite = function () {
            return this.regions.length > 0;
        };
        /**
         * Tests the state to see if it is an orthogonal state;
         * an orthogonal state is one that has two or more child regions.
         * @method isOrthogonal
         * @returns {boolean} True if the state is an orthogonal state.
         */
        State.prototype.isOrthogonal = function () {
            return this.regions.length > 1;
        };
        /**
         * Tests a region to determine if it is deemed to be complete.
         * A region is complete if its current state is final (a state having on outbound transitions).
         * @method isComplete
         * @param {IActiveStateConfiguration} instance The object representing a particular state machine instance.
         * @returns {boolean} True if the region is deemed to be complete.
         */
        State.prototype.isComplete = function (instance) {
            for (var i = 0, l = this.regions.length; i < l; i++) {
                if (this.regions[i].isComplete(instance) === false) {
                    return false;
                }
            }
            return true;
        };
        /**
         * Adds behaviour to a state that is executed each time the state is exited.
         * @method exit
         * @param {(message: any, instance: IActiveStateConfiguration, history: boolean) => any} exitAction The action to add to the state's exit behaviour.
         * @returns {State} Returns the state to allow a fluent style API.
         */
        State.prototype.exit = function (exitAction) {
            this.exitBehavior.push(exitAction);
            this.root().clean = false;
            return this;
        };
        /**
         * Adds behaviour to a state that is executed each time the state is entered.
         * @method entry
         * @param {(message: any, instance: IActiveStateConfiguration, history: boolean) => any} entryAction The action to add to the state's entry behaviour.
         * @returns {State} Returns the state to allow a fluent style API.
         */
        State.prototype.entry = function (entryAction) {
            this.entryBehavior.push(entryAction);
            this.root().clean = false;
            return this;
        };
        State.prototype.bootstrap = function (deepHistoryAbove) {
            var _this = this;
            for (var i = 0, l = this.regions.length; i < l; i++) {
                var region = this.regions[i];
                region.reset();
                region.bootstrap(deepHistoryAbove);
                this.leave.push(function (message, instance, history) {
                    invoke(region.leave, message, instance, history);
                });
                this.endEnter = this.endEnter.concat(region.enter);
            }
            _super.prototype.bootstrap.call(this, deepHistoryAbove);
            this.leave = this.leave.concat(this.exitBehavior);
            this.beginEnter = this.beginEnter.concat(this.entryBehavior);
            this.beginEnter.push(function (message, instance, history) {
                if (_this.region) {
                    instance.setCurrent(_this.region, _this);
                }
            });
            this.enter = this.beginEnter.concat(this.endEnter);
        };
        State.prototype.select = function (message, instance) {
            var result;
            for (var i = 0, l = this.transitions.length; i < l; i++) {
                if (this.transitions[i].guard(message, instance)) {
                    if (result) {
                        throw "Multiple outbound transitions evaluated true";
                    }
                    result = this.transitions[i];
                }
            }
            return result;
        };
        State.prototype.evaluate = function (message, instance) {
            var processed = false;
            for (var i = 0, l = this.regions.length; i < l; i++) {
                if (this.isActive(instance) === true) {
                    if (this.regions[i].evaluate(message, instance)) {
                        processed = true;
                    }
                }
            }
            if (processed === false) {
                processed = _super.prototype.evaluate.call(this, message, instance);
            }
            if (processed === true && message !== this) {
                this.evaluateCompletions(this, instance, false);
            }
            return processed;
        };
        State.prototype.accept = function (visitor, param) {
            visitor.visitState(this, param);
        };
        return State;
    })(Vertex);
    fsm.State = State;
    /**
     * An element within a state machine model that represents completion of the life of the containing Region within the state machine instance.
     *
     * A final state cannot have outbound transitions.
     *
     * FinalState extends the State class and inherits its public interface.
     * @class FinalState
     * @augments State
     */
    var FinalState = (function (_super) {
        __extends(FinalState, _super);
        /**
         * Creates a new instance of the FinalState class.
         * @param {string} name The name of the final state.
         * @param {Element} parent The parent element that owns the final state.
         */
        function FinalState(name, parent) {
            _super.call(this, name, parent);
        }
        FinalState.prototype.to = function (target) {
            throw "A FinalState cannot be the source of a transition.";
        };
        FinalState.prototype.accept = function (visitor, param) {
            visitor.visitFinalState(this, param);
        };
        return FinalState;
    })(State);
    fsm.FinalState = FinalState;
    /**
     * An element within a state machine model that represents the root of the state machine model.
     *
     * StateMachine extends the State class and inherits its public interface.
     * @class StateMachine
     * @augments State
     */
    var StateMachine = (function (_super) {
        __extends(StateMachine, _super);
        /**
         * Creates a new instance of the StateMachine class.
         * @param {string} name The name of the state machine.
         */
        function StateMachine(name) {
            _super.call(this, name, undefined);
            // NOTE: would like an equivalent of internal or package-private
            this.clean = true;
        }
        StateMachine.prototype.root = function () {
            return this;
        };
        StateMachine.prototype.isActive = function (instance) {
            return true;
        };
        /**
         * Bootstraps the state machine model; precompiles the actions to take during transition traversal.
         *
         * Bootstrapping a state machine model pre-calculates all the actions required for each transition within the state machine model.
         * The actions will exit all states as appropriate, perform transition behaviour, enter all states as appropriate and update the current state.
         *
         * This is only required if you are dynamically changing the state machine model and want to manually control when the model is bootstrapped.
         * @method bootstrap
         */
        StateMachine.prototype.bootstrap = function (deepHistoryAbove) {
            _super.prototype.reset.call(this);
            this.clean = true;
            _super.prototype.bootstrap.call(this, deepHistoryAbove);
            this.accept(StateMachine.bootstrap, false);
        };
        /**
         * Initialises an instance of the state machine and enters its initial pseudo state.
         * Entering the initial pseudo state may cause a chain of other completion transitions.
         * @method initialise
         * @param {IActiveStateConfiguration} instance The object representing a particular state machine instance.
         * @param {boolean} autoBootstrap Set to false to manually control when bootstrapping occurs.
         */
        StateMachine.prototype.initialise = function (instance, autoBootstrap) {
            if (autoBootstrap === void 0) { autoBootstrap = true; }
            if (autoBootstrap && this.clean === false) {
                this.bootstrap(false);
            }
            invoke(this.enter, undefined, instance, false);
        };
        /**
         * Passes a message to a state machine instance for evaluation.
         *
         * The message will cause the guard conditions of outbound transitions from the current state to be evaluated; if a single guard evaluates true, it will trigger transition traversal.
         * Transition traversal may cause a chain of transitions to be traversed.
         * @method evaluate
         * @param {any} message A message to pass to a state machine instance for evaluation that may cause a state transition.
         * @param {IActiveStateConfiguration} instance The object representing a particular state machine instance.
         * @param {boolean} autoBootstrap Set to false to manually control when bootstrapping occurs.
         * @returns {boolean} True if the method caused a state transition.
         */
        StateMachine.prototype.evaluate = function (message, instance, autoBootstrap) {
            if (autoBootstrap === void 0) { autoBootstrap = true; }
            if (autoBootstrap && this.clean === false) {
                this.bootstrap(false);
            }
            if (instance.isTerminated) {
                return false;
            }
            return _super.prototype.evaluate.call(this, message, instance);
        };
        StateMachine.prototype.accept = function (visitor, param) {
            visitor.visitStateMachine(this, param);
        };
        StateMachine.bootstrap = new Bootstrap();
        return StateMachine;
    })(State);
    fsm.StateMachine = StateMachine;
    /**
     * A transition between vertices (states or pseudo states) that may be traversed in response to a message.
     *
     * Transitions come in a variety of types:
     * internal transitions respond to messages but do not cause a state transition, they only have behaviour;
     * local transitions are contained within a single region therefore the source vertex is exited, the transition traversed, and the target state entered;
     * external transitions are more complex in nature as they cross region boundaries, all elements up to but not not including the common ancestor are exited and entered.
     *
     * Entering a composite state will cause the entry of the child regions within the composite state; this in turn may trigger more transitions.
     * @class Transition
     */
    var Transition = (function () {
        /**
         * Creates a new instance of the Transition class.
         * @param {Vertex} source The source of the transition.
         * @param {Vertex} source The target of the transition.
         */
        function Transition(source, target) {
            var _this = this;
            this.source = source;
            this.target = target;
            this.transitionBehavior = [];
            this.traverse = [];
            // transitions are initially completion transitions, where the message is the source state itself
            this.guard = function (message, instance) {
                return message === _this.source;
            };
        }
        /**
         * Turns a transition into an else transition.
         *
         * Else transitions can be used at `Junction` or `Choice` pseudo states if no other transition guards evaluate true, an Else transition if present will be traversed.
         * @method else
         * @returns {Transition} Returns the transition object to enable the fluent API.
         */
        Transition.prototype.else = function () {
            this.guard = Transition.isElse;
            return this;
        };
        /**
         * Defines the guard condition for the transition.
         * @method when
         * @param {(message: any, instance: IActiveStateConfiguration) => boolean} guard The guard condition that must evaluate true for the transition to be traversed.
         * @returns {Transition} Returns the transition object to enable the fluent API.
         */
        Transition.prototype.when = function (guard) {
            this.guard = guard;
            return this;
        };
        /**
         * Add behaviour to a transition.
         * @method effect
         * @param {(message: any, instance: IActiveStateConfiguration, history: boolean) => any} transitionAction The action to add to the transitions traversal behaviour.
         * @returns {Transition} Returns the transition object to enable the fluent API.
         */
        Transition.prototype.effect = function (transitionAction) {
            this.transitionBehavior.push(transitionAction);
            this.source.root().clean = false;
            return this;
        };
        Transition.prototype.accept = function (visitor, param) {
            visitor.visitTransition(this, param);
        };
        Transition.isElse = function (message, instance) {
            return false;
        };
        return Transition;
    })();
    fsm.Transition = Transition;
    function invoke(actions, message, instance, history) {
        for (var i = 0, l = actions.length; i < l; i++) {
            actions[i](message, instance, history);
        }
    }
    function assert(condition, error) {
        if (!condition) {
            throw error;
        }
    }
    /**
     * Default working implementation of a state machine instance class.
     *
     * Implements the `IActiveStateConfiguration` interface.
     * It is possible to create other custom instance classes to manage state machine state in any way (e.g. as serialisable JSON); just implement the same members and methods as this class.
     * @class Context
     * @implements IActiveStateConfiguration
     */
    var StateMachineInstance = (function () {
        function StateMachineInstance(name) {
            if (name === void 0) { name = "unnamed"; }
            this.name = name;
            this.isTerminated = false;
            this.last = {};
        }
        /**
         * Updates the last known state for a given region.
         * @method setCurrent
         * @param {Region} region The region to update the last known state for.
         * @param {State} state The last known state for the given region.
         */
        StateMachineInstance.prototype.setCurrent = function (region, state) {
            this.last[region.qualifiedName] = state;
        };
        /**
         * Returns the last known state for a given region.
         * @method getCurrent
         * @param {Region} region The region to update the last known state for.
         * @returns {State} The last known state for the given region.
         */
        StateMachineInstance.prototype.getCurrent = function (region) {
            return this.last[region.qualifiedName];
        };
        StateMachineInstance.prototype.toString = function () {
            return this.name;
        };
        return StateMachineInstance;
    })();
    fsm.StateMachineInstance = StateMachineInstance;
})(fsm || (fsm = {}));