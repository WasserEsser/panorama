'use strict';

                                               
	            
		     
		  
		          
		    
		           
			    
				      
				        
				     
				   
				      
				     
				       
				         
				    
				     
			    
			    
	           
	          
	        
  


                                                     
                                                       
                                                     
var PartyMenu = ( function()
{
	var m_eventRebuildPartyList;

	var m_prevMembersInParty = -1;

	var _Init = function()
	{
		_RefreshPartyMembers();
		_AddOnActivateLeaveBtn();
	};

	var _RefreshPartyMembers = function()
	{
		if ( !_IsSessionActive() )
		{
			return;
		}

		var lobbySettings = LobbyAPI.GetSessionSettings().game;
		if ( !lobbySettings )
		{
			return;
		}


		var elPartyMembersList = $( '#PartyList' ).FindChildInLayoutFile( 'PartyMembers' );
		var numPlayersActuallyInParty = PartyListAPI.GetCount();

		if ( numPlayersActuallyInParty > m_prevMembersInParty )
		{
			$.DispatchEvent( 'PlaySoundEffect', 'UIPanorama.Lobby.Joined', 'PartyList' );
		}
		else if ( numPlayersActuallyInParty < m_prevMembersInParty )
		{
			$.DispatchEvent( 'PlaySoundEffect', 'UIPanorama.Lobby.Left', 'PartyList' );
		}

		m_prevMembersInParty = numPlayersActuallyInParty;


		                                                                                    
		if ( numPlayersActuallyInParty >= PartyListAPI.GetPartySessionUiThreshold() || _IsSeaching() )
		{
			elPartyMembersList.RemoveAndDeleteChildren();
			_UpdateMembersList( lobbySettings, numPlayersActuallyInParty );
		}
		else
		{
			$( '#PartyList' ).AddClass( 'hidden' );
			elPartyMembersList.RemoveAndDeleteChildren();
			friendsList.HideLocalPlayer( false );
		}

		_UpdateLeaveBtn( numPlayersActuallyInParty );
	};

	var _IsSessionActive = function()
	{
		if ( !LobbyAPI.IsSessionActive() )
		{
			$( '#PartyList' ).AddClass( 'hidden' );
			friendsList.HideLocalPlayer( false );
			return false;
		}

		return true;
	};

	var _UpdateMembersList = function( lobbySettings, numPlayersActuallyInParty )
	{
		var maxCoopSlots = 2;
		var maxCompetitiveSlots = 5;

		                                                                  
		                                                                                          
		var maxAllowedInLobby = 10;
		var numPlayersPossibleInMode = ( lobbySettings.mode === 'scrimcomp2v2' || lobbySettings.type === 'cooperative' ) ?
			maxCoopSlots : maxCompetitiveSlots;

		$( '#PartyList' ).RemoveClass( 'hidden' );

		friendsList.HideLocalPlayer( true );

		for ( var i = 0; i < maxAllowedInLobby; i++ )
		{
			var xuid = i < numPlayersActuallyInParty ? PartyListAPI.GetXuidByIndex( i ) : 0;
		
			var isOverPossible = ( numPlayersActuallyInParty > numPlayersPossibleInMode ) ? true : false;
			var elPartyMemberCurrent = null;

			if ( i < numPlayersActuallyInParty )
			{
				elPartyMemberCurrent = _MakeNewPartyMemberTile( "PartyMember" + i, xuid );
				_SetPartyMemberName( elPartyMemberCurrent, xuid );
				_SetPartyMemberRank( elPartyMemberCurrent, xuid );
				_SetPrimeForMember( elPartyMemberCurrent, xuid );
				_UpdateAvatar( elPartyMemberCurrent, xuid )
				_TintForOverPlayerCountForMode( elPartyMemberCurrent, isOverPossible );
			}
		}

		_SetLobbyTitle( numPlayersPossibleInMode, numPlayersActuallyInParty );
	};

	var _MakeNewPartyMemberTile = function( panelIdToLoad, xuid )
	{
		var elParent = $.GetContextPanel().FindChildInLayoutFile( 'PartyMembers' );
		var elPartyMember = $.CreatePanel( "Panel", elParent, panelIdToLoad );
		elPartyMember.BLoadLayoutSnippet( 'PartyMember' );
		elPartyMember.Data().xuid = xuid; 
		var memberBtn = elPartyMember.FindChildInLayoutFile( 'PartyMemberBtn');

		var elAvatar =  $.CreatePanel( "Panel", memberBtn, xuid );
		_SetAttributeStringsOnAvatarPanel( elAvatar, xuid );
		elAvatar.BLoadLayout( 'file://{resources}/layout/avatar.xml', false, false );
		elAvatar.BLoadLayoutSnippet( "AvatarParty" );
		elAvatar.enabled = false;

		memberBtn.MoveChildBefore( elAvatar,memberBtn.GetChild( 0 ) );

		if ( xuid !== 0 && xuid )
			_AddOpenPlayerCardAction( memberBtn, xuid );
		else
			_ClearExisitingOnActivateEvent( memberBtn );

		return elPartyMember;
	};

	var _UpdateAvatar = function( elPartyMember, xuid )
	{
		var elAvatar = elPartyMember.FindChildInLayoutFile( xuid );
		Avatar.Init( elAvatar, xuid, 'playercard' );
	};

	var _SetPartyMemberName = function( elPartyMember, xuid )
	{
		var elName = elPartyMember.FindChildInLayoutFile( 'JsFriendName' );
		elName.text = FriendsListAPI.GetFriendName( xuid );
	};

	var _SetPartyMemberRank = function( elPartyMember, xuid )
	{
		var skillgroupType = PartyListAPI.GetFriendCompetitiveRankType( xuid );
		var skillGroup = PartyListAPI.GetFriendCompetitiveRank( xuid, skillgroupType );
		var wins = PartyListAPI.GetFriendCompetitiveWins( xuid, skillgroupType );
		var winsNeededForRank = 10;
		var elRank = elPartyMember.FindChildInLayoutFile( 'PartyRank' ); 
		
		if ( wins < winsNeededForRank || wins >= winsNeededForRank && skillGroup < 1 )
		{
			elRank.visible = false;
			return;
		}

		var imageName = ( skillgroupType !== 'Competitive' ) ? skillgroupType : 'skillgroup';
		elRank.SetImage( 'file://{images}/icons/skillgroups/' + imageName + skillGroup + '.svg' );
		elRank.visible = true;
	};

	var _SetPrimeForMember = function( elPartyMember, xuid )
	{
		var elPrime = elPartyMember.FindChildInLayoutFile( 'PartyPrime' ); 
		elPrime.visible = PartyListAPI.GetFriendPrimeEligible( xuid );
	};

	var _TintForOverPlayerCountForMode = function ( elPartyMember, isOverCount )
	{
		elPartyMember.SetHasClass( 'friendtile--warning', isOverCount );
	}

	var _SetLobbyTitle = function (  numPlayersPossibleInMode, numPlayersActuallyInParty )
	{
		var elPanel = $( '#PartyList' ).FindChildInLayoutFile( 'PartyListHeader' );
		var isSoloSearch = ( numPlayersActuallyInParty === 1 );

		elPanel.FindChildInLayoutFile( 'PartyTitleAlert' ).visible = !isSoloSearch;
		elPanel.FindChildInLayoutFile( 'PartyCancelBtn' ).visible = LobbyAPI.BIsHost() && _IsSeaching();

		if ( isSoloSearch )
			return;

		var elCount = elPanel.FindChildInLayoutFile( 'PartyTitleAlertText' );
		elCount.text = numPlayersActuallyInParty +'/' +numPlayersPossibleInMode;

		                                                                         
		                                                          
	}

	var _SetAttributeStringsOnAvatarPanel = function( elAvatar, xuid )
	{
		elAvatar.SetAttributeString( 'xuid', xuid );
		elAvatar.SetAttributeString( 'showleader', _ShowLobbyLeaderIcon( xuid ) );
	};

	var _ShowLobbyLeaderIcon = function( xuid )
	{
		return LobbyAPI.GetHostSteamID() === xuid ? 'show' : '';
	};

	var _AddOpenPlayerCardAction = function( elPartyMember, xuid )
	{
		var openCard = function( xuid )
		{
			                                                                                             
			$.DispatchEvent( 'SidebarContextMenuActive', true );

			if ( xuid !== 0 )
			{
				var contextMenuPanel = UiToolkitAPI.ShowCustomLayoutContextMenuParametersDismissEvent(
					'',
					'',
					'file://{resources}/layout/context_menus/context_menu_playercard.xml',
					'xuid=' + xuid,
					function()
					{
						$.DispatchEvent( 'SidebarContextMenuActive', false );
					}
				);
				contextMenuPanel.AddClass( "ContextMenu_NoArrow" );
			}
		};

		elPartyMember.SetPanelEvent( "onactivate", openCard.bind( undefined, xuid ) );
		elPartyMember.SetPanelEvent( "oncontextmenu", openCard.bind( undefined, xuid ) );
	};

	var _ClearExisitingOnActivateEvent = function( elPartyMember )
	{
		elPartyMember.SetPanelEvent( "onactivate", function()
		{

		} );

		var OnMouseOver = function( elPartyMember )
		{
			UiToolkitAPI.ShowTextTooltip( elPartyMember.id, '#tooltip_invite_to_lobby' );
		};

		elPartyMember.SetPanelEvent( "onmouseover", OnMouseOver.bind( undefined, elPartyMember ) );

		elPartyMember.SetPanelEvent( "onmouseout", function()
		{
			UiToolkitAPI.HideTextTooltip();
		} );
	};

	var _SessionUpdate = function( updateType )
	{
		                                                                                                      
		if ( LobbyAPI.IsSessionActive() )
		{
			if ( m_eventRebuildPartyList == undefined )
			{
				m_eventRebuildPartyList = $.RegisterForUnhandledEvent( "PanoramaComponent_PartyList_RebuildPartyList", PartyMenu.RefreshPartyMembers );
			}
		}
		else
		{
			$.UnregisterForUnhandledEvent( "PanoramaComponent_PartyList_RebuildPartyList", m_eventRebuildPartyList );
			m_eventRebuildPartyList = undefined;
		}

		_RefreshPartyMembers();
	};

	var _UpdateLobbyMember = function( xuid )
	{
		var elPartyMembersList = $( '#PartyList' ).FindChildInLayoutFile( 'PartyMembers' );

		elPartyMembersList.Children.forEach(element => {
			if ( element.Data().xuid === xuid )
			{
				_UpdateExistingPartyMember( element, xuid );
			}
		});
	};

	                                                                                                    
	var _UpdateLeaveBtn = function ( numPlayersActuallyInParty )
	{
		var elLeaveBtn = $( '#PartyList' ).FindChildInLayoutFile( 'PartyLeaveBtn' );
		elLeaveBtn.visible = ( !GameStateAPI.IsLocalPlayerPlayingMatch() && LobbyAPI.IsSessionActive() && numPlayersActuallyInParty > 1 );
	};

	var _AddOnActivateLeaveBtn= function ()
	{
		var elLeaveBtn = $( '#PartyList' ).FindChildInLayoutFile( 'PartyLeaveBtn' );
		elLeaveBtn.SetPanelEvent( 'onactivate', function(){ LobbyAPI.CloseSession(); } );
	};
	
	                                                                                                    
	                          
	                                                                                                    
	var _GetSearchStatus = function()
	{
		return LobbyAPI.GetMatchmakingStatusString();
	};

	var _IsSeaching = function()
	{
		var StatusString = _GetSearchStatus();
		return ( StatusString !== '' && StatusString !== null ) ? true : false;
	};

	return {
		Init	: _Init,
		SessionUpdate	: _SessionUpdate,
		RefreshPartyMembers	:_RefreshPartyMembers,
		UpdateLobbyMember:	_UpdateLobbyMember,
	};
} )();




                                                                                                    
                                           
                                                                                                    
(function()
{
	PartyMenu.Init();
	$.RegisterForUnhandledEvent( "PanoramaComponent_Lobby_MatchmakingSessionUpdate", PartyMenu.SessionUpdate );
	$.RegisterForUnhandledEvent( "PanoramaComponent_Lobby_PlayerUpdated", PartyMenu.SessionUpdate );

})();
