          
   
   

"use strict"; 

var Chat = ( function ()
{
	var m_isContentPanelOpen = false;
	var m_ChatPanel = $( "#PartyChat" );
	var m_OriginalParent = m_ChatPanel.GetParent();                                                                                                               
	
	function _Init() 
	{
		var elInput = $( '#ChatInput' );
		elInput.SetPanelEvent( 'oninputsubmit', Chat.ChatTextSubmitted );

		var elOpenChat = $.GetContextPanel().FindChildInLayoutFile( 'ChatContainer' );
		elOpenChat.SetPanelEvent( "onactivate", function ()
		{
			_OpenChat();
		} );
		
		var elCloseChat = $.GetContextPanel().FindChildInLayoutFile( 'ChatCloseButton' );
		elCloseChat.SetPanelEvent( "onactivate", function ()
		{
			_Close();
		} );
	}

	function _OpenChat()
	{
		var elChatContainer = $( '#ChatContainer' );
		
		if ( !elChatContainer.BHasClass( "chat-open" ) )
		{
			elChatContainer.RemoveClass( 'closed-minimized' );
			elChatContainer.AddClass( "chat-open" );
			$( "#ChatInput" ).SetFocus();
			$( "#ChatInput" ).activationenabled = true;
			
			                                   
			
			$.Schedule( .1, _ScrollToBottom );
		}
	}

	function _Close()
	{
		var elChatContainer = $( '#ChatContainer' );
		if ( elChatContainer.BHasClass( "chat-open" ) )
		{
			elChatContainer.RemoveClass( "chat-open" );
			elChatContainer.SetFocus();
			$( "#ChatInput" ).activationenabled = false;
			                                    
			$.Schedule( .1, _ScrollToBottom );

			_SetClosedHeight();
			return true;                                            
		}

		return false;
	}

	function _SetClosedHeight()
	{
		var elChatContainer = $( '#ChatContainer' );
		if ( !elChatContainer.BHasClass( "chat-open" ) )
		{
			elChatContainer.SetHasClass( 'closed-minimized', m_isContentPanelOpen );
			$.Schedule( .1, _ScrollToBottom );
		}
	}

	function _ChatTextSubmitted()
	{
		$.GetContextPanel().SubmitChatText();

		$( '#ChatInput' ).text = "";
	}

	function _ShowPlayerCard( strSteamID ) 
	{
		var contextMenuPanel = UiToolkitAPI.ShowCustomLayoutContextMenuParameters(
			'',
			'',
			'file://{resources}/layout/context_menus/context_menu_playercard.xml',
			                            
			'xuid=' + strSteamID
		);
	}

	function _OnNewChatEntry()
	{
		$.Schedule( .1, _ScrollToBottom );
	}

	function _ScrollToBottom()
	{
		$( '#ChatLinesContainer' ).ScrollToBottom();
	}

	function _SessionUpdate( status )
	{
		var elChat = $.GetContextPanel().FindChildInLayoutFile( 'ChatPanelContainer' );

		if ( status === 'closed' )
			_ClearChatMessages();

		if ( !LobbyAPI.IsSessionActive() )
		{
			elChat.AddClass( 'hidden' );
		}
		else
		{
			var numPlayersActuallyInParty = PartyListAPI.GetCount();
			var networkSetting = PartyListAPI.GetPartySessionSetting( "system/network" );
			
			elChat.SetHasClass( 'hidden', ( networkSetting !== 'LIVE' ) );

			if ( networkSetting !== 'LIVE' )
			{
				_Close();
			}

			var elPlaceholder = $.GetContextPanel().FindChildInLayoutFile( 'PlaceholderText' );

			if ( numPlayersActuallyInParty > 1 )
			{
				elPlaceholder.text = $.Localize( '#party_chat_placeholder' );
			}
			else
			{
				elPlaceholder.text = $.Localize( '#party_chat_placeholder_empty_lobby' );
			}
		}
	}

	function _ClearChatMessages()
	{
		var elMessagesContainer = $( '#ChatLinesContainer' );
		elMessagesContainer.RemoveAndDeleteChildren();
	}

	var _ClipPanelToNotOverlapSideBar = function ( noClip )
	{
		var panelToClip = $.GetContextPanel();
		if ( !panelToClip || panelToClip.BHasClass( 'hidden' ))
			return;
		
		                                                                     
		                                                                                     
		if ( $.GetContextPanel().GetParent().id !== 'MainMenuFriendsAndParty' )
			return;

		var panelToClipWidth = panelToClip.actuallayoutwidth;
		var friendsListWidthWhenExpanded = panelToClip.GetParent().FindChildInLayoutFile( 'mainmenu-sidebar__blur-target' ).contentwidth;
		
		var sideBarWidth = noClip ? 0 : friendsListWidthWhenExpanded;
		var widthDiff = panelToClipWidth - sideBarWidth;
		var clipPercent = ( panelToClipWidth <= 0 || widthDiff <= 0 ? 1 : ( widthDiff / panelToClipWidth ) ) * 100;

		if ( clipPercent )
			panelToClip.style.clip = 'rect( 0%, ' + clipPercent + '%, 100%, 0% );';
	};

	var _OnHideContentPanel = function ()
	{
		m_isContentPanelOpen = false;
		_SetClosedHeight();
	};

	var _OnShowContentPanel = function ()
	{
		m_isContentPanelOpen = true;
		_SetClosedHeight();
	};

	var _OnShowAcceptPopup = function( popup )
	{
		m_ChatPanel.SetParent( popup.FindChild( 'id-accept-match' ) );

		var elChatContainer = $( '#ChatContainer' );
		
		                                                                           
		                                                                             
		                                                 
		if ( elChatContainer.BHasClass( "chat-open" ) )
		{
			$( "#ChatInput" ).SetFocus();
			$( "#ChatInput" ).activationenabled = true;
		}
	};

	var _OnCloseAcceptPopup = function() 
	{
		m_ChatPanel.SetParent( m_OriginalParent );
		var elPreviousPeer = m_OriginalParent.FindChild( 'JsMainMenuSidebar' );
		m_OriginalParent.MoveChildAfter( m_ChatPanel, elPreviousPeer );

		                                                                                      
		                                        
		m_ChatPanel.style.y = '0px';
		_Init();
	};

	return {
		Init 					: _Init,
		ChatTextSubmitted  		: _ChatTextSubmitted,
		ShowPlayerCard			: _ShowPlayerCard,
		SessionUpdate			: _SessionUpdate,
		NewChatEntry			: _OnNewChatEntry,
		OnSideBarHover:  _ClipPanelToNotOverlapSideBar,
		OnHideContentPanel: _OnHideContentPanel,
		OnShowContentPanel: _OnShowContentPanel,
		Close 					: _Close,
		OnShowAcceptPopup: _OnShowAcceptPopup,
		OnCloseAcceptPopup : _OnCloseAcceptPopup
	 };
})();

                                                                                                    
                                           
                                                                                                    
(function()
{
	Chat.Init();
	$.RegisterForUnhandledEvent( "PanoramaComponent_Lobby_MatchmakingSessionUpdate", Chat.SessionUpdate );
	$.RegisterForUnhandledEvent( "OnNewChatEntry", Chat.NewChatEntry );
	$.RegisterEventHandler( "Cancelled", $.GetContextPanel(), Chat.Close );
	$.RegisterForUnhandledEvent( 'SidebarIsCollapsed', Chat.OnSideBarHover );
	$.RegisterForUnhandledEvent( 'HideContentPanel', Chat.OnHideContentPanel );
	$.RegisterForUnhandledEvent( 'ShowContentPanel', Chat.OnShowContentPanel );
	$.RegisterForUnhandledEvent( 'ShowAcceptPopup', Chat.OnShowAcceptPopup );
	$.RegisterForUnhandledEvent( 'CloseAcceptPopup', Chat.OnCloseAcceptPopup );
	

})();
